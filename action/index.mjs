import { App } from "octokit";

console.log(process.env);

const app = new App({
  auth: process.env.GH_TOKEN,
});

// Create a new issue in the current repository
await app.octokit.rest.issues.create({
  owner: context.repo.owner,
  repo: context.repo.repo,
  title: 'New Issue',
  body: 'This is a new issue created by the Replexica Action'
});

console.log('Issue created');
