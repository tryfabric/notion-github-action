import {Client, LogLevel} from '@notionhq/client/build/src';
import * as core from '@actions/core';
import type {IssuesEditedEvent, IssuesOpenedEvent} from '@octokit/webhooks-definitions/schema';
import type {WebhookPayload} from '@actions/github/lib/interfaces';
import {properties} from './properties';

interface Options {
  notion: {
    token: string;
    databaseId: string;
  };
  github: {
    payload: WebhookPayload;
  };
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
    properties: {
      Name: properties.title(payload.issue.title),
      Organization: properties.richText(payload.organization?.login ?? ''),
      Repository: properties.richText(payload.repository.name),
      Number: properties.number(payload.issue.number),
      Body: properties.richText(payload.issue.body),
      Assignees: properties.richText(payload.issue.assignees.map(user => user.login).join(', ')),
      Milestone: properties.richText(payload.issue.milestone?.title ?? ''),
      Labels: properties.richText(payload.issue.labels?.map(label => label.name).join(', ') ?? ''),
      Author: properties.richText(payload.issue.user.login),
      Created: properties.date(payload.issue.created_at),
      Updated: properties.date(payload.issue.updated_at),
      Status: properties.richText(payload.issue.state),
    },
  });
}

interface IssueEditedOptions {
  notion: {
    client: Client;
    databaseId: string;
  };
  payload: IssuesEditedEvent;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// @ts-expect-error implement
async function handleIssueEdited(options: IssueEditedOptions) {}

export async function run(options: Options) {
  const {notion, github} = options;

  core.info('Starting...');

  const notionClient = new Client({
    auth: notion.token,
    logLevel: core.isDebug() ? LogLevel.DEBUG : LogLevel.WARN,
  });

  switch (github.payload.action) {
    case 'opened':
      await handleIssueOpened({
        notion: {
          client: notionClient,
          databaseId: notion.databaseId,
        },
        payload: github.payload as IssuesOpenedEvent,
      });
      break;

    case 'edited':
      await handleIssueEdited({
        notion: {
          client: notionClient,
          databaseId: notion.databaseId,
        },
        payload: github.payload as IssuesEditedEvent,
      });
      break;

    default:
      core.setFailed(`Action ${github.payload.action} not supported`);
  }

  core.info('Complete!');
}
