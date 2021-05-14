import * as core from '@actions/core';
import { run } from './action';

const NOTION_TOKEN_KEY = 'notion-token';
const NOTION_DB_KEY = 'notion-db';

try {
  (async () => {
    const notionToken = core.getInput(NOTION_TOKEN_KEY);
    const databaseId = core.getInput(NOTION_DB_KEY);

    await run(notionToken, databaseId);
  })();
} catch (e) {
  core.setFailed(e.message);
}
