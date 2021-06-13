# Notion x GitHub Action

[![Code Style: Google](https://img.shields.io/badge/code%20style-google-blueviolet.svg)](https://github.com/google/gts)


Connect your GitHub issues to a Notion database.

---

## Configure

1. [Create a new internal Notion integration](https://www.notion.so/my-integrations) and note the value of the Internal Integration Token
2. In your GitHub Repository Settings > Secrets, add a `New repository secret`. Set the `Name` to `NOTION_TOKEN` and the `Value` to the Internal Integration Token you created in the previous step.
3. Set up your Notion Database. Use [this template](https://www.notion.so/2d7f45dc13b4407cbc1417bd69e145e3?v=c110721ca140425a8d3a8dd1bc93ee08) and duplicate it to your workspace.
4. In your Database's `Share` menu, add the Notion integration you created as a member with the `Can edit` privilege.
5. Find the ID of your Database by copying the link to it. The link will have the format
```
https://www.notion.so/abc?v=123
```
where `abc` is the database id.

7. Add the Database's ID as a repository secret for your GitHub repository. Set the `Name` to `NOTION_DATABASE` and the `Value` to the id of your Database.

## Use the Action

In your GitHub repository, create a GitHub workflow to use this Action in.

At minimum, the workflow must run on `issues.opened`. To have the database update, the workflow must also run on the following issue types: `opened, edited, labeled, unlabeled, assigned, unassigned, milestoned, demilestoned, reopened, closed`.

An example workflow is
```yaml
on:
  issues:
    types: [opened, edited, labeled, unlabeled, assigned, unassigned, milestoned, demilestoned, reopened, closed]

jobs:
  notion_job:
    runs-on: ubuntu-latest
    name: Add to Notion
    steps:
      - name: Add to Notion
        uses: instantish/notion-github-action@1.0.0
        with:
          notion-token: ${{ secrets.NOTION_TOKEN }}
          notion-db: ${{ secrets.NOTION_DATABASE }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
```
