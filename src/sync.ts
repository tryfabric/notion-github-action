import {Client} from '@notionhq/client/build/src';
import {
  DatabasesQueryResponse,
  InputPropertyValueMap,
} from '@notionhq/client/build/src/api-endpoints';
import {Issue} from '@octokit/webhooks-types/schema';
import * as core from '@actions/core';
import {Octokit} from 'octokit';
import {properties} from './properties';
import {NumberPropertyValue, Page} from '@notionhq/client/build/src/api-types';

type PageIdAndIssueNumber = {
  pageId: string;
  issueNumber: number;
};

export async function createIssueMapping(
  notion: Client,
  databaseId: string
): Promise<Map<number, string>> {
  const issuePageIds = new Map<number, string>();
  const issuesAlreadyInNotion: {
    pageId: string;
    issueNumber: number;
  }[] = await getIssuesAlreadyInNotion(notion, databaseId);
  for (const {pageId, issueNumber} of issuesAlreadyInNotion) {
    issuePageIds.set(issueNumber, pageId);
  }
  return issuePageIds;
}

export async function syncNotionDBWithGitHub(
  issuePageIds: Map<number, string>,
  octokit: Octokit,
  notion: Client,
  databaseId: string,
  githubRepo: string
) {
  const issues = await getGitHubIssues(octokit, githubRepo);
  const pagesToCreate = getIssuesNotInNotion(issuePageIds, issues);
  await createPages(notion, databaseId, pagesToCreate);
}

// Notion SDK for JS: https://developers.notion.com/reference/post-database-query
async function getIssuesAlreadyInNotion(
  notion: Client,
  databaseId: string
): Promise<PageIdAndIssueNumber[]> {
  core.info('Checking for issues already in the database...');
  const pages = [];
  let cursor = undefined;
  let next_cursor: string | null = 'true';
  while (next_cursor) {
    const response: DatabasesQueryResponse = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
    });
    next_cursor = response.next_cursor;
    const results: Page[] = response.results;
    pages.push(...results);
    if (!next_cursor) {
      break;
    }
    cursor = next_cursor;
  }
  return pages.map(page => {
    const num = <NumberPropertyValue>page.properties['Number'];
    return {
      pageId: page.id,
      issueNumber: num.number,
    };
  });
}

// https://docs.github.com/en/rest/reference/issues#list-repository-issues
async function getGitHubIssues(octokit: Octokit, githubRepo: string): Promise<Issue[]> {
  core.info('Finding Github Issues...');
  const issues: Issue[] = [];
  const iterator = octokit.paginate.iterator(octokit.rest.issues.listForRepo, {
    owner: githubRepo.split('/')[0],
    repo: githubRepo.split('/')[1],
    state: 'all',
    per_page: 100,
  });
  for await (const {data} of iterator) {
    for (const issue of data) {
      if (!issue.pull_request) {
        issues.push(<Issue>issue);
      }
    }
  }
  return issues;
}

function getIssuesNotInNotion(issuePageIds: Map<number, string>, issues: Issue[]): Issue[] {
  const pagesToCreate: Issue[] = [];
  for (const issue of issues) {
    if (!issuePageIds.has(issue.number)) {
      pagesToCreate.push(issue);
    }
  }
  return pagesToCreate;
}

// Notion SDK for JS: https://developers.notion.com/reference/post-page
async function createPages(
  notion: Client,
  databaseId: string,
  pagesToCreate: Issue[]
): Promise<void> {
  core.info('Adding Github Issues to Notion...');
  await Promise.all(
    pagesToCreate.map(issue =>
      notion.pages.create({
        parent: {database_id: databaseId},
        properties: getPropertiesFromIssue(issue),
      })
    )
  );
}

/*
 *  For the `Asignees` field in the Notion DB we want to send only issues.assignees.login
 *  For the `Labels` field in the Notion DB we want to send only issues.labels.name
 */
function createMultiSelectObjects(issue: Issue): {
  assigneesObject: string[];
  labelsObject: string[] | undefined;
} {
  const assigneesObject = issue.assignees.map((assignee: {login: string}) => assignee.login);
  const labelsObject = issue.labels?.map((label: {name: string}) => label.name);
  return {assigneesObject, labelsObject};
}

function getPropertiesFromIssue(issue: Issue): InputPropertyValueMap {
  const {number, title, state, id, milestone, created_at, updated_at, body, repository_url, user} =
    issue;
  const author = user?.login;
  const {assigneesObject, labelsObject} = createMultiSelectObjects(issue);
  const urlComponents = repository_url.split('/');
  const org = urlComponents[urlComponents.length - 2];
  const repo = urlComponents[urlComponents.length - 1];

  // These properties are specific to the template DB referenced in the README.
  return {
    Name: properties.title(title),
    Status: properties.getStatusSelectOption(state!),
    Body: properties.text(body ? body : ''),
    Organization: properties.text(org),
    Repository: properties.text(repo),
    Number: properties.number(number),
    Assignees: properties.multiSelect(assigneesObject),
    Milestone: properties.text(milestone ? milestone.title : ''),
    Labels: properties.multiSelect(labelsObject ? labelsObject : []),
    Author: properties.text(author),
    Created: properties.date(created_at),
    Updated: properties.date(updated_at),
    ID: properties.number(id),
  };
}
