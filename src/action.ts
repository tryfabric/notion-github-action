import {Client, LogLevel} from '@notionhq/client/build/src';
import * as core from '@actions/core';
import type {IssuesEvent, IssuesOpenedEvent} from '@octokit/webhooks-definitions/schema';
import type {WebhookPayload} from '@actions/github/lib/interfaces';
import {properties} from './properties';
import type {InputPropertyValueMap} from '@notionhq/client/build/src/api-endpoints';
import {createIssueMapping, syncNotionDBWithGitHub} from './sync';
import {Octokit} from 'octokit';

function removeHTML(text?: string): string {
  return text?.replace(/<.*>.*<\/.*>/g, '') ?? '';
}

function parsePropertiesFromPayload(payload: IssuesEvent): InputPropertyValueMap {
  const parsedBody = removeHTML(payload.issue.body);

  payload.issue.labels?.map(label => label.color);

  const result: InputPropertyValueMap = {
    Name: properties.title(payload.issue.title),
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
  };

  if (payload.issue.state) {
    result['Status'] = properties.getStatusSelectOption(payload.issue.state);
  }

  return result;
}

interface IssueOpenedOptions {
  notion: {
    client: Client;
    databaseId: string;
  };
  payload: IssuesOpenedEvent;
}

async function handleIssueOpened(options: IssueOpenedOptions) {
  const {notion, payload} = options;

  core.info(`Creating page for issue #${payload.issue.number}`);

  await notion.client.pages.create({
    parent: {
      database_id: notion.databaseId,
    },
    properties: parsePropertiesFromPayload(payload),
  });
}

interface IssueEditedOptions {
  notion: {
    client: Client;
    databaseId: string;
  };
  payload: IssuesEvent;
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

  const pageId = query.results[0].id;

  core.info(`Query successful: Page ${pageId}`);
  core.info(`Updating page for issue #${payload.issue.number}`);

  await notion.client.pages.update({
    page_id: pageId,
    properties: parsePropertiesFromPayload(payload),
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
  };
}

export async function run(options: Options) {
  const {notion, github} = options;

  core.info('Starting...');

  const notionClient = new Client({
    auth: notion.token,
    logLevel: core.isDebug() ? LogLevel.DEBUG : LogLevel.WARN,
  });

  if (github.payload.action === 'opened') {
    await handleIssueOpened({
      notion: {
        client: notionClient,
        databaseId: notion.databaseId,
      },
      payload: github.payload as IssuesOpenedEvent,
    });
  } else if (github.eventName === 'workflow_dispatch') {
    const octokit = new Octokit({auth: core.getInput('github-token')});
    const notion = new Client({auth: core.getInput('notion-token')});
    const databaseId = core.getInput('notion-db');
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
    });
  }

  core.info('Complete!');
}
