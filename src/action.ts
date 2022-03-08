import {Client, LogLevel} from '@notionhq/client/build/src';
import * as core from '@actions/core';
import type {IssuesEvent, IssuesOpenedEvent} from '@octokit/webhooks-definitions/schema';
import type {WebhookPayload} from '@actions/github/lib/interfaces';
import {CustomValueMap, properties} from './properties';
import {createIssueMapping, syncNotionDBWithGitHub} from './sync';
import {Octokit} from 'octokit';
import {markdownToRichText} from '@tryfabric/martian';
import {CustomTypes} from './api-types';
import {CreatePageParameters} from '@notionhq/client/build/src/api-endpoints';

function removeHTML(text?: string): string {
  return text?.replace(/<.*>.*<\/.*>/g, '') ?? '';
}

function parsePropertiesFromPayload(payload: IssuesEvent): CustomValueMap {
  payload.issue.labels?.map(label => label.color);

  const result: CustomValueMap = {
    Name: properties.title(payload.issue.title),
    Status: properties.getStatusSelectOption(payload.issue.state!),
    Organization: properties.text(payload.organization?.login ?? ''),
    Repository: properties.text(payload.repository.name),
    Number: properties.number(payload.issue.number),
    Body: properties.richText(parseBodyRichText(payload.issue.body)),
    Assignees: properties.multiSelect(payload.issue.assignees.map(assignee => assignee.login)),
    Milestone: properties.text(payload.issue.milestone?.title ?? ''),
    Labels: properties.multiSelect(payload.issue.labels?.map(label => label.name) ?? []),
    Author: properties.text(payload.issue.user.login),
    Created: properties.date(payload.issue.created_at),
    Updated: properties.date(payload.issue.updated_at),
    ID: properties.number(payload.issue.id),
    Link: properties.url(payload.issue.html_url),
  };

  return result;
}

export function parseBodyRichText(body: string) {
  return markdownToRichText(removeHTML(body)) as CustomTypes.RichText['rich_text'];
}

function getBodyChildrenBlocks(body: string): Exclude<CreatePageParameters['children'], undefined> {
  // We're currently using only one paragraph block, but this could be extended to multiple kinds of blocks.
  return [
    {
      type: 'paragraph',
      paragraph: {
        text: parseBodyRichText(body),
      },
    },
  ];
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
    children: getBodyChildrenBlocks(payload.issue.body),
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

  const bodyBlocks = getBodyChildrenBlocks(payload.issue.body);

  if (query.results.length > 0) {
    const pageId = query.results[0].id;

    core.info(`Query successful: Page ${pageId}`);
    core.info(`Updating page for issue #${payload.issue.number}`);

    await notion.client.pages.update({
      page_id: pageId,
      properties: parsePropertiesFromPayload(payload),
    });

    const existingBlocks = (
      await notion.client.blocks.children.list({
        block_id: pageId,
      })
    ).results;

    const overlap = Math.min(bodyBlocks.length, existingBlocks.length);

    await Promise.all(
      bodyBlocks.slice(0, overlap).map((block, index) =>
        notion.client.blocks.update({
          block_id: existingBlocks[index].id,
          ...block,
        })
      )
    );

    if (bodyBlocks.length > existingBlocks.length) {
      await notion.client.blocks.children.append({
        block_id: pageId,
        children: bodyBlocks.slice(overlap),
      });
    } else if (bodyBlocks.length < existingBlocks.length) {
      await Promise.all(
        existingBlocks
          .slice(overlap)
          .map(block => notion.client.blocks.delete({block_id: block.id}))
      );
    }
  } else {
    core.warning(`Could not find page with github id ${payload.issue.id}, creating a new one`);

    await notion.client.pages.create({
      parent: {
        database_id: notion.databaseId,
      },
      properties: parsePropertiesFromPayload(payload),
      children: bodyBlocks,
    });
  }
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
