# Notion x GitHub Action

[![Code Style: Google](https://img.shields.io/badge/code%20style-google-blueviolet.svg)](https://github.com/google/gts)

Connect your GitHub issues to a Notion database.

**Like this GitHub Action?** Give us a ⭐️ and [follow us on Twitter for more drops 🪂](https://twitter.com/tryfabric).

---

## Quick Start

1. [Create a new internal Notion integration](https://www.notion.so/my-integrations) and note the value of the Internal Integration Token.
2. In your GitHub repository, go to `Settings` > `Secrets`, and add a `New repository secret`. Set the `Name` to `NOTION_TOKEN` and the `Value` to the Internal Integration Token you created in the previous step.
3. Set up your Notion Database. Use [this template](https://www.notion.so/tryfabric/067329ee12044ec49b7db6b39b26920a?v=38dd7e968874436c810a5e604d2cf12c) and duplicate it to your workspace. <img width="683" alt="Screen Shot 2021-06-14 at 11 37 51 AM" src="https://user-images.githubusercontent.com/1459660/121919427-0194ed80-cd05-11eb-81e2-6692099afae7.png">
4. In your Notion Database page's `Share` menu, add the Notion integration you created as a member with the `Can edit` privilege. You may have to type your integration's name in the `Invite` field. <img width="719" alt="Screen Shot 2021-06-14 at 11 41 25 AM" src="https://user-images.githubusercontent.com/1459660/121919912-7f58f900-cd05-11eb-8e7b-960ba0d4519e.png">
5. Find the ID of your Database by copying the link to it. The link will have the format

```
https://www.notion.so/abc?v=123
```

where `abc` is the database id.

6. Add the Database's ID as a repository secret for your GitHub repository. Set the `Name` to `NOTION_DATABASE` and the `Value` to the id of your Database.

7. In your GitHub repository, create a GitHub workflow file at the path `.github/workflows/issues-notion-sync.yml`.

```yaml
name: Notion Sync

on:
  workflow_dispatch:
  issues:
    types:
      [
        opened,
        edited,
        labeled,
        unlabeled,
        assigned,
        unassigned,
        milestoned,
        demilestoned,
        reopened,
        closed,
      ]

jobs:
  notion_job:
    runs-on: ubuntu-latest
    name: Add GitHub Issues to Notion
    steps:
      - name: Add GitHub Issues to Notion
        uses: instantish/notion-github-action@v1.2.0
        with:
          notion-token: ${{ secrets.NOTION_TOKEN }}
          notion-db: ${{ secrets.NOTION_DATABASE }}
```

8. (Optional) If your Github repository has any preexisting issues that you would like to sync to your new Notion Database you can trigger a manual workflow. Make sure your organization's default `GITHUB_TOKEN` has [read and write permissions](https://docs.github.com/en/organizations/managing-organization-settings/disabling-or-limiting-github-actions-for-your-organization#setting-the-permissions-of-the-github_token-for-your-organization) then follow [these intructions](https://docs.github.com/en/actions/managing-workflow-runs/manually-running-a-workflow) to run the `Notion Job` workflow.

_Note: The manual workflow will only work on Notion Databases created from the templated linked above._

## Using `release-it`

1. Locally, on `master` (make sure it's up to date), execute `GITHUB_TOKEN=<TOKEN> release-it`. (Alternatively, set `GITHUB_TOKEN` as a system environment variable)
2. Follow the interactive prompts, selecting `Yes` for all options.
3. When selecting the increment, choose `patch` when the release is only bug fixes. For new features, choose `minor`. For major changes, choose `major`.

Release-It will then automatically generate a GitHub release with the changelog inside.

---

Built with 💙 by the team behind [Fabric](https://tryfabric.com).
