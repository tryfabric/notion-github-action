export async function setInitialGitHubToNotionIdMap(params) {
  const currentIssues = await getIssuesFromNotionDatabase(params.notion, params.databaseId)
  for (const { pageId, issueNumber } of currentIssues) {
    params.gitHubIssuesIdToNotionPageId[issueNumber] = pageId
  }
  return params.gitHubIssuesIdToNotionPageId
}
 
export async function syncNotionDatabaseWithGitHub(params) {
  console.log("\nFetching issues from Notion DB...")
  const issues = await getGitHubIssuesForRepository(params)
  const { pagesToCreate, pagesToUpdate } = getNotionOperations(params.gitHubIssuesIdToNotionPageId, issues)
  await createPages(params.notion, params.databaseId, params.OPERATION_BATCH_SIZE, pagesToCreate)
  await updatePages(params.notion, params.OPERATION_BATCH_SIZE, pagesToUpdate)
}
 
async function getIssuesFromNotionDatabase(notion, databaseId) {
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
 
async function getGitHubIssuesForRepository(params) {
  const octokit = params.octokit
  const issues = []
  const iterator = octokit.paginate.iterator(octokit.rest.issues.listForRepo, {
    owner: params.org,
    repo: params.repo,
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
 

function getNotionOperations(gitHubIssuesIdToNotionPageId, issues) {
  const pagesToCreate = []
  const pagesToUpdate = []
  for (const issue of issues) {
    const pageId = gitHubIssuesIdToNotionPageId[issue.number]
    if (pageId) {
      pagesToUpdate.push({
        ...issue,
        pageId,
      })
    } else {
      pagesToCreate.push(issue)
    }
  }
  return { pagesToCreate, pagesToUpdate }
}
 

async function createPages(notion, databaseId, OPERATION_BATCH_SIZE, pagesToCreate) {
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
 
async function updatePages(notion, OPERATION_BATCH_SIZE, pagesToUpdate) {
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
