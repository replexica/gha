import { Octokit, App } from "octokit";

const octokit = new Octokit({ auth: process.env.GH_TOKEN });

// Create a new issue in the current repository
await octokit.rest.issues.create({
  owner: context.repo.owner,
  repo: context.repo.repo,
  title: 'New Issue',
  body: 'This is a new issue created by the Replexica Action'
});

console.log('Issue created');
