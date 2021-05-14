import * as core from '@actions/core';
import * as github from '@actions/github';
import { run } from './action';

const NOTION_TOKEN_KEY = 'notion-token';
const NOTION_DB_KEY = 'notion-db';
const GITHUB_TOKEN_KEY = 'github-token';

async function start() {
  try {
    const notionToken = core.getInput(NOTION_TOKEN_KEY);
    const notionDb = core.getInput(NOTION_DB_KEY);
    const githubToken = core.getInput(GITHUB_TOKEN_KEY);

    const options = {
      notion: {
        token: notionToken,
        databaseId: notionDb,
      },
      github: {
        owner: github.context.issue.owner,
        repo: github.context.issue.repo,
        issueNumber: github.context.issue.number,
        octokit: github.getOctokit(githubToken),
      },
    };

    await run(options);
  } catch (e) {
    core.setFailed(e.message);
  }
}

(async () => {
  await start();
})();
