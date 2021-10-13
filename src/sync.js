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
      issueNumber: page.properties["Number"].number,
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
        console.log("ISSUE:")
        console.log(issue)
        issues.push({
          number: issue.number,
          title: issue.title,
          state: issue.state,
          id: issue.id,
          labels: issue.labels,
          assignees: issue.assignees,
          milestone: issue.milestone,
          created: issue.created_at,
          updated: issue.updated_at,
          body: issue.body,
          repo_url: issue.repository_url,
          author: issue.user.login
        })
      }
    }
  }
  return issues
}

function getIssuesNotInNotion(issuePageIds, issues) {
  const pagesToCreate = []
  for (const issue of issues) {
    if (!(issue.number in issuePageIds)) {
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
  let { number, title, state, id, labels, asignees, milestone, created, updated, body, repo_url, author } = issue
  const urlComponents = repo_url.split("/")
  const org = urlComponents[urlComponents.length - 2]
  const repo = urlComponents[urlComponents.length - 1]
  if (!body) body = ''
  if (!asignees) asignees = []
  if (!milestone) { 
    milestone = ''
  } else {
    milestone = milestone.title
  }
  if (!labels) labels = []
  const properties = {
    Name: {
      title: [{ type: "text", text: { "content": title } }]
    },
    Status: {
      select: { name: state }
    },
    Body: {
      rich_text: [{ type: "text", text: { content: body } }]
    },
    Organization: {
      rich_text: [{ type: "text", text: { content: org } }]
    },
    Repository: {
      rich_text: [{ type: "text", text: { content: repo } }]
    },
    Number: {
      number
    },
    Assignees: {
      multi_select: asignees
    },
    Milestone: {
      rich_text: [{ type: "text", text: { content: milestone } }]
    },
    Labels: {
      multi_select: labels
    },
    Author: {
      rich_text: [{ type: "text", text: { content: author } }]
    },
    Created: {
      date: { "start": created }
    },
    Updated: {
      date: { "start": updated }
    },
    ID: {
      number: id
    }
  }
  console.log("properties: ")
  console.log(properties)
  return properties
}
