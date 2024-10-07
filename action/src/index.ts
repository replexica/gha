import { execSync } from 'child_process';

import loadConfig from './instances/config.js';
// Uses GitHub's official Octokit
import loadOctokit from './instances/octokit.js';
import doStuff from './do-stuff.js';

// Run

(async function main() {
  const config = await loadConfig();
  const octokit = await loadOctokit();

  // Commit changes
  execSync('git config --global user.name "Replexica"');
  execSync('git config --global user.email "support@replexica.com"');
  execSync(`git config --global safe.directory ${process.cwd()}`);

  if (!config.isPullRequestMode) {
    // Do stuff
    await doStuff();
    execSync('git add .');
    execSync(`git commit -m "${config.commitMessage}"`);
    execSync('git push');
  } else {
    // Calculate automated branch name
    const prBranchName = `replexica/${config.currentBranchName}`;

    execSync(`git fetch origin ${prBranchName} && git checkout ${prBranchName} || git checkout -b ${prBranchName}`);
    execSync(`git merge ${config.currentBranchName}`);

    // Do stuff
    await doStuff();
    execSync('git add .');
    execSync(`git commit -m "${config.commitMessage}"`);
    execSync(`git push --set-upstream origin "${prBranchName}"`);

    // Create PR
    await octokit.rest.pulls.create({
      owner: config.repositoryOwner,
      repo: config.repositoryName,
      head: prBranchName,
      base: config.currentBranchName,
      title: config.pullRequestTitle,
    });
  }
})();

