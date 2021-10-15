import * as core from '@actions/core';
import {Client} from '@notionhq/client/build/src';
import {Octokit} from '@octokit/core';
import {PaginateInterface} from '@octokit/plugin-paginate-rest';
import {Api} from '@octokit/plugin-rest-endpoint-methods/dist-types/types';
import {RequestError} from '@octokit/request-error';
import type {Page} from '@notionhq/client/build/src/api-types';
import {DatabasesQueryResponse} from '@notionhq/client/build/src/api-endpoints';

/*
interface NotionDBProperties {
  Updated: DatePropertyValue;
  Body: RichTextInputPropertyValue;
  Status: SelectPropertyValue;
  Assignees: MultiSelectPropertyValue;
  Number: NumberPropertyValue;
  Labels: MultiSelectPropertyValue;
  ID: NumberPropertyValue;
  Author: RichTextInputPropertyValue;
  Repository: RichTextInputPropertyValue;
  Milestone: RichTextInputPropertyValue;
  Created: DatePropertyValue;
  Organization: RichTextInputPropertyValue;
  Name: TitleInputPropertyValue;
}
*/

// TODO theres gotta be an importable type for these Github things
type GithubLabel = {
  id: number;
  node_id: string;
  url: string;
  name: string;
  color: string;
  default: Boolean;
  description: string;
};

type GithubAssignee = {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: Boolean;
};

type GithubIssue = {
  number: number;
  title: string;
  state: string;
  id: number;
  labels: Array<GithubLabel>;
  assignees: Array<GithubAssignee>;
  milestone: string;
  created: string;
  updated: string;
  body: string;
  repo_url: string;
  author: string;
};

export async function createIssueMapping(notion: Client, databaseId: string) {
  const issuePageIds = new Map<string, string>();
  const issuesAlreadyInNotion = await getIssuesAlreadyInNotion(notion, databaseId);
  for (const {pageId, issueNumber} of issuesAlreadyInNotion) {
    issuePageIds.set(issueNumber, pageId);
  }
  return issuePageIds;
}

export async function syncNotionDBWithGitHub(
  issuePageIds: Map<string, string>,
  octokit: Octokit & {paginate: PaginateInterface} & Api & {
      retry: {
        retryRequest: (error: RequestError, retries: number, retryAfter: number) => RequestError;
      };
    },
  notion: Client,
  databaseId: string
) {
  const issues = await getGitHubIssues(octokit);
  const pagesToCreate = getIssuesNotInNotion(issuePageIds, issues);
  await createPages(notion, databaseId, pagesToCreate);
}

// Notion SDK for JS: https://developers.notion.com/reference/post-database-query
async function getIssuesAlreadyInNotion(notion: Client, databaseId: string) {
  const pages = Array<Page>();
  let cursor = undefined;
  while (cursor !== null) {
    const {results, next_cursor} = (await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
    })) as DatabasesQueryResponse;
    console.log('DATABASEQUERY RESULT');
    console.log(results);
    pages.push(...results);
    if (!next_cursor) {
      break;
    }
    cursor = next_cursor;
  }
  return pages.map(page => {
    return {
      pageId: page.id,
      issueNumber: page.properties['Number'].id,
    };
  });
}

// https://docs.github.com/en/rest/reference/issues#list-repository-issues
async function getGitHubIssues(octokit: {
  paginate: {
    iterator: (
      arg0: any,
      arg1: {owner: string; repo: string; state: string; per_page: number}
    ) => any;
  };
  rest: {issues: {listForRepo: any}};
}) {
  const issues = [];
  const iterator = octokit.paginate.iterator(octokit.rest.issues.listForRepo, {
    owner: core.getInput('github-org'),
    repo: core.getInput('github-repo'),
    state: 'all',
    per_page: 100,
  });
  for await (const {data} of iterator) {
    for (const issue of data) {
      if (!issue.pull_request) {
        issues.push({
          number: issue.number,
          title: issue.title,
          state: issue.state,
          id: issue.id,
          labels: issue.labels,
          assignees: issue.assignees,
          milestone: issue.milestone,
          created: issue.created_at,
          updated: issue.updated_at,
          body: issue.body,
          repo_url: issue.repository_url,
          author: issue.user.login,
        });
      }
    }
  }
  return issues;
}

function getIssuesNotInNotion(issuePageIds: Map<string, string>, issues: Array<GithubIssue>) {
  const pagesToCreate = [];
  for (const issue of issues) {
    if (!(issue.number in issuePageIds)) {
      pagesToCreate.push(issue);
    }
  }
  return pagesToCreate;
}

// Notion SDK for JS: https://developers.notion.com/reference/post-page
async function createPages(notion: Client, databaseId: string, pagesToCreate: any[]) {
  await Promise.all(
    pagesToCreate.map((issue: any) =>
      notion.pages.create({
        parent: {database_id: databaseId},
        properties: getPropertiesFromIssue(issue) as any,
      })
    )
  );
}

function validateIssueProperties(issue: any) {
  if (!issue.body) issue.body = '';
  if (!issue.asignees) issue.asignees = [];
  if (!issue.milestone) {
    issue.milestone = '';
  } else {
    issue.milestone = issue.milestone.title;
  }
  if (!issue.labels) issue.labels = [];
  return issue;
}

/* The only properties of type `multi-select` are issue.assignees and issue.labels.
 *  For issues.assignees we want to send the `login` field to the Notion DB.
 *  For issues.labels we want to send the `name` field to the NOtion DB.
 */
function createMultiSelectObject(items: any) {
  const multiSelectObject = [];
  for (const item of items) {
    multiSelectObject.push({
      name: item.name ? item.name : item.login,
    });
  }
  return multiSelectObject;
}

function getPropertiesFromIssue(issue: GithubIssue) {
  issue = validateIssueProperties(issue);
  const {
    number,
    title,
    state,
    id,
    labels,
    assignees,
    milestone,
    created,
    updated,
    body,
    repo_url,
    author,
  } = issue;
  const labelsObject = createMultiSelectObject(labels);
  const assigneesObject = createMultiSelectObject(assignees);
  const urlComponents = repo_url.split('/');
  const org = urlComponents[urlComponents.length - 2];
  const repo = urlComponents[urlComponents.length - 1];

  // These properties are specific to the template DB referenced in the README.
  const properties = {
    Name: {
      title: [{type: 'text', text: {content: title}}],
    },
    Status: {
      select: {name: state},
    },
    Body: {
      rich_text: [{type: 'text', text: {content: body}}],
    },
    Organization: {
      rich_text: [{type: 'text', text: {content: org}}],
    },
    Repository: {
      rich_text: [{type: 'text', text: {content: repo}}],
    },
    Number: {
      number,
    },
    Assignees: {
      multi_select: assigneesObject,
    },
    Milestone: {
      rich_text: [{type: 'text', text: {content: milestone}}],
    },
    Labels: {
      multi_select: labelsObject,
    },
    Author: {
      rich_text: [{type: 'text', text: {content: author}}],
    },
    Created: {
      date: {start: created},
    },
    Updated: {
      date: {start: updated},
    },
    ID: {
      number: id,
    },
  };
  return properties;
}
