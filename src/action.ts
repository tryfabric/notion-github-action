import { Client, LogLevel } from '@notionhq/client/build/src';
import * as core from '@actions/core';
import * as github from '@actions/github';
import * as uuid from 'uuid';

export async function run(notionToken: string, notionDatabaseId: string) {
  const notion = new Client({
    auth: notionToken,
    logLevel: core.isDebug() ? LogLevel.DEBUG : LogLevel.WARN,
  });

  const issueNumber = github.context.issue.number;

  await notion.pages.create({
    parent: {
      database_id: notionDatabaseId,
    },
    properties: {
      Number: {
        type: 'number',
        number: issueNumber,
        id: uuid.v4(),
      },
    },
  });
}
