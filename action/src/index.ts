import { exec, execSync } from 'child_process';
import Ora from 'ora';

import loadConfig from './instances/config.js';
// Uses GitHub's official Octokit
import loadOctokit from './instances/octokit.js';
import doStuff from './do-stuff.js';

// Run

(async function main() {
  const ora = Ora();
  const config = await loadConfig();
  const octokit = await loadOctokit();

  // Configure git
  ora.start('Configuring git');
  execSync('git config --global user.name "Replexica"');
  execSync('git config --global user.email "support@replexica.com"');
  execSync(`git config --global safe.directory ${process.cwd()}`);
  ora.succeed('Git configured');

  // Do stuff
  ora.start('Doing stuff');
  await doStuff();
  ora.succeed('Done doing stuff');

  if (!config.isPullRequestMode) {
    ora.info('Pull request mode is disabled');

    ora.start('Committing changes');
    execSync('git add .');
    execSync(`git commit -m "${config.commitMessage}"`);
    ora.succeed('Changes committed');

    ora.start('Pushing changes to remote');
    execSync('git push');
    ora.succeed('Changes pushed to remote');
  } else {
    ora.info('Pull request mode is enabled');

    ora.info('Calculating automated branch name');
    const prBranchName = `replexica/${config.currentBranchName}`;
    ora.succeed(`Automated branch name calculated: ${prBranchName}`);

    ora.start(`Checking out branch ${prBranchName}`);
    execSync(`git checkout -b ${prBranchName}`);
    ora.succeed(`Checked out branch ${prBranchName}`);

    ora.start('Committing changes');
    execSync('git add .');
    execSync(`git commit -m "${config.commitMessage}"`);
    ora.succeed('Changes committed');

    ora.start('Pushing changes to remote');
    execSync(`git push --force --set-upstream origin "${prBranchName}"`);
    ora.succeed('Changes pushed to remote');

    // Create PR
    ora.start('Creating PR');
    await octokit.rest.pulls.create({
      owner: config.repositoryOwner,
      repo: config.repositoryName,
      head: prBranchName,
      base: config.currentBranchName,
      title: config.pullRequestTitle,
    });
    ora.succeed('PR created');
  }
})();
