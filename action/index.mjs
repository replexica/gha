import { Octokit } from "octokit";

console.log(process.env);

const octokit = new Octokit({ auth: process.env.GH_TOKEN });

// Create a new issue in the current repository
await octokit.rest.issues.create({
  owner: process.env.GITHUB_REPOSITORY_OWNER,
  repo: process.env.GITHUB_REPOSITORY,
  title: 'New Issue',
  body: 'This is a new issue created by the Replexica Action'
});

console.log('Issue created');
