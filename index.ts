import * as core from '@actions/core';

async function run() {
  const notionToken = core.getInput('notion-token');
  console.log('notion token', notionToken);
}

try {
  (async () => {
    await run();
  })();
} catch (e) {
  core.setFailed(e.message);
}
