import { Octokit } from "octokit";
import { simpleGit } from 'simple-git';

import env from './env.js';
import doStuff from "./do-stuff.js";

const octokit = new Octokit({ auth: env.GH_TOKEN });

const git = simpleGit({
  config: {
    user: {
      name: 'Replexica',
      email: 'support@replexica.com'
    },
    safeDirectory: process.cwd(),
  }
});

async function commitChanges() {
  await git.add('.');
  await git.commit(env.REPLEXICA_COMMIT_MESSAGE);
}

export async function getCurrentBranch() {
  let branchName = "";

  if (env.GITHUB_HEAD_REF) {
    // Pull request
    branchName = env.GITHUB_HEAD_REF;
  } else if (env.GITHUB_REF_NAME) {
    // Push or workflow_dispatch
    if (/^refs\/tags\//.test(env.GITHUB_REF)) {
      // It's a tag, return the default branch
      const response = await octokit.request('GET /repos/{owner}/{repo}', {
        owner: env.GITHUB_REPOSITORY_OWNER,
        repo: env.GITHUB_REPOSITORY
      });
      branchName = response.data.default_branch;
    } else {
      branchName = env.GITHUB_REF_NAME;
    }
  } else if (env.GITHUB_REF) {
    // Fallback for other cases
    branchName = env.GITHUB_REF.replace(/^refs\/[^/]*\//, '');
  } else {
    throw new Error('Unable to determine the current branch name. For assistance, send our CTO an email to max@replexica.com.');
  }

  return branchName;
}


// if (!env.REPLEXICA_PULL_REQUEST) {
//   await doStuff();
//   await commitChanges();
//   await git.push();
// } else {

// }

// TODO