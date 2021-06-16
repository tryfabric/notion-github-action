# Notion x GitHub Action

[![Code Style: Google](https://img.shields.io/badge/code%20style-google-blueviolet.svg)](https://github.com/google/gts)


Connect your GitHub issues to a Notion database.

---

## Quick Start

1. [Create a new internal Notion integration](https://www.notion.so/my-integrations) and note the value of the Internal Integration Token.
2. In your GitHub repository, go to `Settings` > `Secrets`, and add a `New repository secret`. Set the `Name` to `NOTION_TOKEN` and the `Value` to the Internal Integration Token you created in the previous step.
3. Set up your Notion Database. Use [this template](https://www.notion.so/2d7f45dc13b4407cbc1417bd69e145e3?v=c110721ca140425a8d3a8dd1bc93ee08) and duplicate it to your workspace. <img width="683" alt="Screen Shot 2021-06-14 at 11 37 51 AM" src="https://user-images.githubusercontent.com/1459660/121919427-0194ed80-cd05-11eb-81e2-6692099afae7.png">
4. In your Notion Database page's `Share` menu, add the Notion integration you created as a member with the `Can edit` privilege. You may have to type your integration's name in the `Invite` field. <img width="719" alt="Screen Shot 2021-06-14 at 11 41 25 AM" src="https://user-images.githubusercontent.com/1459660/121919912-7f58f900-cd05-11eb-8e7b-960ba0d4519e.png">
5. Find the ID of your Database by copying the link to it. The link will have the format
```
https://www.notion.so/abc?v=123
```
where `abc` is the database id.

6. Add the Database's ID as a repository secret for your GitHub repository. Set the `Name` to `NOTION_DATABASE` and the `Value` to the id of your Database.

7. In your GitHub repository, create a GitHub workflow file at the path `.github/workflows/issues-notion-sync.yml`.


```yaml
on:
  issues:
    types: [opened, edited, labeled, unlabeled, assigned, unassigned, milestoned, demilestoned, reopened, closed]

jobs:
  notion_job:
    runs-on: ubuntu-latest
    name: Add GitHub Issues to Notion
    steps:
      - name: Add GitHub Issues to Notion
        uses: instantish/notion-github-action@1.0.0
        with:
          notion-token: ${{ secrets.NOTION_TOKEN }}
          notion-db: ${{ secrets.NOTION_DATABASE }}
```
