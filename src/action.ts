import {Client, LogLevel} from '@notionhq/client/build/src';
import * as core from '@actions/core';
import * as uuid from 'uuid';
import {GitHub} from '@actions/github/lib/utils';
import {RichTextText} from '@notionhq/client/build/src/api-types';

interface Options {
  notion: {
    token: string;
    databaseId: string;
  };
  github: {
    octokit: InstanceType<typeof GitHub>;
    owner: string;
    repo: string;
    issueNumber: number;
  };
}

export async function run(options: Options) {
  const {notion, github} = options;

  const notionClient = new Client({
    auth: notion.token,
    logLevel: core.isDebug() ? LogLevel.DEBUG : LogLevel.WARN,
  });

  core.info('Retrieving issue...');

  const issue = await github.octokit.issues.get({
    owner: github.owner,
    repo: github.repo,
    issue_number: github.issueNumber,
  });

  core.info('Creating page...');

  await notionClient.pages.create({
    parent: {
      database_id: notion.databaseId,
    },
    properties: {
      Name: {
        type: 'title',
        title: [
          {
            type: 'text',
            text: {
              content: issue.data.title,
            },
          } as RichTextText,
        ],
        id: uuid.v4(),
      },
      Number: {
        type: 'number',
        number: issue.data.number,
        id: uuid.v4(),
      },
    },
  });

  core.info('Done.');
}
