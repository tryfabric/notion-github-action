import * as core from '@actions/core';


export async function createIssueMapping(notion, databaseId) {
  const issuePageIds = {}
  const issuesAlreadyInNotion = await getIssuesAlreadyInNotion(notion, databaseId)
  for (const { pageId, issueNumber } of issuesAlreadyInNotion) {
    issuePageIds[issueNumber] = pageId
  }
  return issuePageIds
}
 
export async function syncNotionDBWithGitHub(issuePageIds, octokit, notion, databaseId) {
  const issues = await getGitHubIssues(octokit)
  const pagesToCreate = getIssuesNotInNotion(issuePageIds, issues)
  await createPages(notion, databaseId, pagesToCreate)
}
 
async function getIssuesAlreadyInNotion(notion, databaseId) {
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
  await Promise.all(
    pagesToCreate.map(issue =>
      notion.pages.create({
        parent: { database_id: databaseId },
        properties: getPropertiesFromIssue(issue),
      })
    )
  )
}

function getPropertiesFromIssue(issue) {
  console.log("ISSUE: ")
  console.log(issue)
  const { title, number, state, id, body, organization, repo } = issue
  return {
    "Name": {
      title: [{ type: "text", text: { content: title } }],
    },
    "Status": {
      select: { name: state },
    },
    "Body": {
      rich_text: body,
    },
    "Organization": {
      rich_text: "",
    },
    "Repository": {
      rich_text: "",
    },
    "Number": {
      number,
    },
    "Assignees": {
      multi_select: { },
    },
    "Milestones": {
      rich_text: "",
    },
    "Labels": {
      multi_select: { },
    },
    "Author": {
      rich_text: "julia",
    },
    "Created": {
      date: "",
    },
    "Updated": {
      date: "",
    },
    "ID": {
      number: id
    },
  }
}
