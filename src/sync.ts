import * as core from '@actions/core';
import {Client} from '@notionhq/client/build/src';
import {DatabasesQueryResponse} from '@notionhq/client/build/src/api-endpoints';
import {Octokit} from 'octokit';

export async function createIssueMapping(notion: Client, databaseId: string) {
  const issuePageIds = new Map<string, string>();
  const issuesAlreadyInNotion = await getIssuesAlreadyInNotion(notion, databaseId);
  let pageId: string;
  let issueNumber: string;
  for ({pageId, issueNumber} of issuesAlreadyInNotion) {
    issuePageIds.set(issueNumber, pageId);
  }
  return issuePageIds;
}

export async function syncNotionDBWithGitHub(
  issuePageIds: Map<string, string>,
  octokit: Octokit,
  notion: Client,
  databaseId: string
) {
  const issues = await getGitHubIssues(octokit);
  const pagesToCreate = getIssuesNotInNotion(issuePageIds, issues);
  await createPages(notion, databaseId, pagesToCreate);
}

// Notion SDK for JS: https://developers.notion.com/reference/post-database-query
async function getIssuesAlreadyInNotion(notion: Client, databaseId: string) {
  const pages = [];
  let cursor = undefined;
  // @ts-ignore
  while (true) {
    const response: DatabasesQueryResponse = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
    });
    const next_cursor = response.next_cursor;
    const results = response.results;
    pages.push(...results);
    if (!next_cursor) {
      break;
    }
    cursor = next_cursor;
  }
  return pages.map(page => {
    return {
      pageId: page.id,
      // @ts-ignore
      issueNumber: page.properties['Number'].number,
    };
  });
}

// https://docs.github.com/en/rest/reference/issues#list-repository-issues
async function getGitHubIssues(octokit: Octokit) {
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
          author: issue.user!.login,
        });
      }
    }
  }
  return issues;
}

function getIssuesNotInNotion(issuePageIds: Map<string, string>, issues: any) {
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
    pagesToCreate.map(issue =>
      notion.pages.create({
        parent: {database_id: databaseId},
        //@ts-ignore
        properties: getPropertiesFromIssue(issue),
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

function getPropertiesFromIssue(issue: any) {
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
