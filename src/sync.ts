import {Client} from '@notionhq/client/build/src';
import {DatabasesQueryResponse} from '@notionhq/client/build/src/api-endpoints';
import * as gh from '@octokit/webhooks-types/schema';
import * as core from '@actions/core';
import {Octokit} from 'octokit';
import {properties} from './properties';

export async function createIssueMapping(notion: Client, databaseId: string) {
  const issuePageIds = new Map<number, string>();
  const issuesAlreadyInNotion: {
    pageId: string;
    issueNumber: number;
  }[] = await getIssuesAlreadyInNotion(notion, databaseId);
  console.info(issuesAlreadyInNotion);
  for (const {pageId, issueNumber} of issuesAlreadyInNotion) {
    issuePageIds.set(issueNumber, pageId);
  }
  core.info(`isssuePageIds: ${JSON.stringify(issuePageIds)}`);
  return issuePageIds;
}

export async function syncNotionDBWithGitHub(
  issuePageIds: Map<string, string>,
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
async function getIssuesAlreadyInNotion(notion: Client, databaseId: string) {
  core.info('Checking for issues already in the database...');
  const pages = [];
  let cursor = undefined;
  // @ts-ignore
  while (true) {
    const response: DatabasesQueryResponse = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
    });
    core.info(`response: ${response}`);
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
async function getGitHubIssues(octokit: Octokit, githubRepo: string) {
  core.info('Finding Github Issues...');
  const issues: gh.Issue[] = [];
  // TODO add try catch
  const iterator = octokit.paginate.iterator(octokit.rest.issues.listForRepo, {
    owner: githubRepo.split('/')[0],
    repo: githubRepo.split('/')[1],
    state: 'all',
    per_page: 100,
  });
  for await (const {data} of iterator) {
    for (const issue of data) {
      core.info(`issue author: ${issue.user?.login}`);
      if (!issue.pull_request) {
        // @ts-ignore
        issues.push(issue);
      }
    }
  }
  return issues;
}

function getIssuesNotInNotion(issuePageIds: Map<number, string>, issues: gh.Issue[]) {
  const pagesToCreate = [];
  for (const issue of issues) {
    core.info(JSON.stringify(issuePageIds));
    if (!issuePageIds.has(issue.number)) {
      pagesToCreate.push(issue);
    }
  }
  return pagesToCreate;
}

// Notion SDK for JS: https://developers.notion.com/reference/post-page
async function createPages(notion: Client, databaseId: string, pagesToCreate: gh.Issue[]) {
  core.info('Adding Github Issues to Notion...');
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

/*
 *  For the `Asignees` field in the Notion DB we want to send only issues.assignees.login
 *  For the `Labels` field in the Notion DB we want to send only issues.labels.name
 */
function createMultiSelectObjects(issue: gh.Issue) {
  const assigneesObject = issue.assignees.map((assignee: {login: string}) => assignee.login);
  const labelsObject = issue.labels?.map((label: {name: string}) => label.name);
  return {assigneesObject, labelsObject};
}

function getPropertiesFromIssue(issue: gh.Issue) {
  const {number, title, state, id, milestone, created_at, updated_at, body, repository_url, user} =
    issue;
  const author = user?.login;
  core.info(`author getProps: ${author}`);
  const {assigneesObject, labelsObject} = createMultiSelectObjects(issue);
  const urlComponents = repository_url.split('/');
  const org = urlComponents[urlComponents.length - 2];
  const repo = urlComponents[urlComponents.length - 1];

  // These properties are specific to the template DB referenced in the README.
  const props = {
    Name: properties.title(title),
    Status: {
      select: {name: state},
    },
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
  return props;
}
