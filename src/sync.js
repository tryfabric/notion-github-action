import * as core from '@actions/core';
import _ from "lodash";

const OPERATION_BATCH_SIZE = 10;

export async function createIssueMapping(notion, databaseId) {
  const issuePageIds = {}
  console.log("\nsetInitialGitHubToNotionIdMap")
  const issuesAlreadyInNotion = await getIssuesAlreadyInNotion(notion, databaseId)
  for (const { pageId, issueNumber } of issuesAlreadyInNotion) {
    issuePageIds[issueNumber] = pageId
  }
  console.log("githubIssuesIdToNotionPageId Map")
  console.log(issuePageIds)
  return issuePageIds
}
 
export async function syncNotionDBWithGitHub(issuePageIds, octokit, notion, databaseId) {
  console.log("\nFetching issues from Notion DB...")
  const issues = await getGitHubIssues(octokit)
  const pagesToCreate = getIssuesNotInNotion(issuePageIds, issues)
  await createPages(notion, databaseId, pagesToCreate)
}
 
async function getIssuesAlreadyInNotion(notion, databaseId) {
  console.log("\ngetIssuesFromNotionDatabase")
  const pages = []
  let cursor = undefined
  while (true) {
    const { results, next_cursor } = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
    })
    pages.push(...results)
    if (!next_cursor) {
      break
    }
    cursor = next_cursor
  }
  return pages.map(page => {
    return {
      pageId: page.id,
      issueNumber: page.properties["Issue Number"].number,
    }
  })
}
 
async function getGitHubIssues(octokit) {
  console.log("\ngetGitHubIssuesForRepository")
  console.log("\noctokit:")
  console.log(octokit)
  const issues = []
  const iterator = octokit.paginate.iterator(octokit.rest.issues.listForRepo, {
    owner: core.getInput('github-org'),
    repo: core.getInput('github-repo'),
    state: "all",
    per_page: 100,
  })
  for await (const { data } of iterator) {
    for (const issue of data) {
      if (!issue.pull_request) {
        issues.push({
          number: issue.number,
          title: issue.title,
          state: issue.state,
          comment_count: issue.comments,
          url: issue.html_url,
        })
      }
    }
  }
  return issues
}

function getIssuesNotInNotion(issuePageIds, issues) {
  console.log("\ngetNotionOperations")
  const pagesToCreate = []
  for (const issue of issues) {
    const pageId = issuePageIds[issue.number]
    if (!pageId) {
      pagesToCreate.push(issue)
    }
  }
  return pagesToCreate
}
 

async function createPages(notion, databaseId, pagesToCreate) {
  console.log("\ncreatePages")
  const pagesToCreateChunks = _.chunk(pagesToCreate, OPERATION_BATCH_SIZE)
  for (const pagesToCreateBatch of pagesToCreateChunks) {
    await Promise.all(
      pagesToCreateBatch.map(issue =>
        notion.pages.create({
          parent: { database_id: databaseId },
          properties: getPropertiesFromIssue(issue),
        })
      )
    )
    console.log(`Completed batch size: ${pagesToCreateBatch.length}`)
  }
}
 
async function updatePages(notion, pagesToUpdate) {
  console.log("\nupdatePages")
  const pagesToUpdateChunks = _.chunk(pagesToUpdate, OPERATION_BATCH_SIZE)
  for (const pagesToUpdateBatch of pagesToUpdateChunks) {
    await Promise.all(
      pagesToUpdateBatch.map(({ pageId, ...issue }) =>
        notion.pages.update({
          page_id: pageId,
          properties: getPropertiesFromIssue(issue),
        })
      )
    )
    console.log(`Completed batch size: ${pagesToUpdateBatch.length}`)
  }
}
 

function getPropertiesFromIssue(issue) {
  const { title, number, state, comment_count, url } = issue
  return {
    Name: {
      title: [{ type: "text", text: { content: title } }],
    },
    "Issue Number": {
      number,
    },
    State: {
      select: { name: state },
    },
    "Number of Comments": {
      number: comment_count,
    },
    "Issue URL": {
      url,
    },
  }
}
