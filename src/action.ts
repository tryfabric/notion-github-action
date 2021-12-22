import {Client, LogLevel} from '@notionhq/client/build/src';
import * as core from '@actions/core';
import type {IssuesEvent, IssuesOpenedEvent} from '@octokit/webhooks-definitions/schema';
import type {WebhookPayload} from '@actions/github/lib/interfaces';
import {CustomValueMap, properties} from './properties';
import {createIssueMapping, syncNotionDBWithGitHub} from './sync';
import {Octokit} from 'octokit';

function removeHTML(text?: string): string {
  return text?.replace(/<.*>.*<\/.*>/g, '') ?? '';
}

interface PayloadParsingOptions {
  payload: IssuesEvent;
  octokit: Octokit;
  possibleProject?: ProjectData;
}
async function parsePropertiesFromPayload(options: PayloadParsingOptions): Promise<CustomValueMap> {
  const {payload, octokit, possibleProject} = options;

  const parsedBody = removeHTML(payload.issue.body);

  payload.issue.labels?.map(label => label.color);

  const projectData = await getProjectData({
    octokit,
    githubRepo: payload.repository.full_name,
    issueNumber: payload.issue.number,
    possible: possibleProject,
  });

  const result: CustomValueMap = {
    Name: properties.title(payload.issue.title),
    Status: properties.getStatusSelectOption(payload.issue.state!),
    Organization: properties.text(payload.organization?.login ?? ''),
    Repository: properties.text(payload.repository.name),
    Number: properties.number(payload.issue.number),
    Body: properties.text(parsedBody),
    Assignees: properties.multiSelect(payload.issue.assignees.map(assignee => assignee.login)),
    Milestone: properties.text(payload.issue.milestone?.title ?? ''),
    Labels: properties.multiSelect(payload.issue.labels?.map(label => label.name) ?? []),
    Author: properties.text(payload.issue.user.login),
    Created: properties.date(payload.issue.created_at),
    Updated: properties.date(payload.issue.updated_at),
    ID: properties.number(payload.issue.id),
    Link: properties.url(payload.issue.html_url),
    Project: properties.text(projectData?.name || ''),
    ProjectColumn: properties.text(projectData?.columnName || ''),
  };

  return result;
}

interface ProjectData {
  name?: string;
  columnName?: string;
}
interface GetProjectDataOptions {
  octokit: Octokit;
  githubRepo: string;
  issueNumber: number;
  possible?: ProjectData;
}
export async function getProjectData(
  options: GetProjectDataOptions
): Promise<ProjectData | undefined> {
  const {octokit, githubRepo, issueNumber, possible} = options;

  const projects =
    (
      await octokit.rest.projects.listForRepo({
        owner: githubRepo.split('/')[0],
        repo: githubRepo.split('/')[1],
      })
    ).data || [];
  projects.sort(p => (p.name === possible?.name ? -1 : 1));

  let res: ProjectData | undefined;

  for (const project of projects) {
    const columns = (await octokit.rest.projects.listColumns({project_id: project.id})).data || [];
    if (possible?.name === project.name)
      columns.sort(c => (c.name === possible.columnName ? -1 : 1));

    for (const column of columns) {
      const cards = (await octokit.rest.projects.listCards({column_id: column.id})).data,
        card =
          cards && cards.find(c => Number(c.content_url?.split('/issues/')[1]) === issueNumber);

      if (card)
        res = {
          name: project.name,
          columnName: column.name,
        };
    }
  }

  return res;
}

interface IssueOpenedOptions {
  notion: {
    client: Client;
    databaseId: string;
  };
  payload: IssuesOpenedEvent;
  octokit: Octokit;
}

async function handleIssueOpened(options: IssueOpenedOptions) {
  const {notion, payload} = options;

  core.info(`Creating page for issue #${payload.issue.number}`);

  await notion.client.pages.create({
    parent: {
      database_id: notion.databaseId,
    },
    properties: await parsePropertiesFromPayload({
      payload,
      octokit: options.octokit,
    }),
  });
}

interface IssueEditedOptions {
  notion: {
    client: Client;
    databaseId: string;
  };
  payload: IssuesEvent;
  octokit: Octokit;
}

async function handleIssueEdited(options: IssueEditedOptions) {
  const {notion, payload} = options;

  core.info(`Querying database for page with github id ${payload.issue.id}`);

  const query = await notion.client.databases.query({
    database_id: notion.databaseId,
    filter: {
      property: 'ID',
      number: {
        equals: payload.issue.id,
      },
    },
    page_size: 1,
  });

  if (query.results.length === 0) {
    core.warning(`Could not find page with github id ${payload.issue.id}`);
    return;
  }

  const result = query.results[0],
    pageId = result.id,
    possible: ProjectData = {
      name: (result.properties as CustomValueMap).Project.rich_text[0].plain_text,
      columnName: (result.properties as CustomValueMap).ProjectColumn.rich_text[0].plain_text,
    };

  core.info(`Query successful: Page ${pageId}`);
  core.info(`Updating page for issue #${payload.issue.number}`);

  await notion.client.pages.update({
    page_id: pageId,
    properties: await parsePropertiesFromPayload({
      payload,
      octokit: options.octokit,
      possibleProject: possible,
    }),
  });
}

interface Options {
  notion: {
    token: string;
    databaseId: string;
  };
  github: {
    payload: WebhookPayload;
    eventName: string;
    token: string;
  };
}

export async function run(options: Options) {
  const {notion, github} = options;

  core.info('Starting...');

  const notionClient = new Client({
    auth: notion.token,
    logLevel: core.isDebug() ? LogLevel.DEBUG : LogLevel.WARN,
  });
  const octokit = new Octokit({auth: github.token});

  if (github.payload.action === 'opened') {
    await handleIssueOpened({
      notion: {
        client: notionClient,
        databaseId: notion.databaseId,
      },
      payload: github.payload as IssuesOpenedEvent,
      octokit,
    });
  } else if (github.eventName === 'workflow_dispatch') {
    const notion = new Client({auth: options.notion.token});
    const {databaseId} = options.notion;
    const issuePageIds = await createIssueMapping(notion, databaseId);
    if (!github.payload.repository?.full_name) {
      throw new Error('Unable to find repository name in github webhook context');
    }
    const githubRepo = github.payload.repository.full_name;
    await syncNotionDBWithGitHub(issuePageIds, octokit, notion, databaseId, githubRepo);
  } else {
    await handleIssueEdited({
      notion: {
        client: notionClient,
        databaseId: notion.databaseId,
      },
      payload: github.payload as IssuesEvent,
      octokit,
    });
  }

  core.info('Complete!');
}
