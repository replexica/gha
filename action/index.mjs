import { Octokit } from "octokit";

console.log(process.env);

const octokit = new Octokit({ auth: process.env.GH_TOKEN });

// Create a new issue in the current repository
const ownerName = process.env.GITHUB_REPOSITORY_OWNER;
const fullRepoName = process.env.GITHUB_REPOSITORY;
const repoName = fullRepoName.split('/')[1];
await octokit.rest.issues.create({
  owner: ownerName,
  repo: repoName,
  title: 'New Issue',
  body: 'This is a new issue created by the Replexica Action'
});

console.log('Issue created');
