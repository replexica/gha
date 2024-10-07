import { exec, execSync } from 'child_process';
import Ora from 'ora';

import loadConfig from './instances/config.js';
// Uses GitHub's official Octokit
import loadOctokit from './instances/octokit.js';

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

  if (!config.isPullRequestMode) {
    ora.info('Pull request mode is disabled');

    // Do stuff
    ora.start('Doing stuff');
    execSync(`npx replexica@latest i18n --api-key ${config.replexicaApiKey}`, { stdio: 'inherit' });
    ora.succeed('Done doing stuff');

    // Check if there are any changes made to the files
    const changes = execSync('git status --porcelain').toString();
    if (changes.length === 0) {
      ora.info('Translations are up to date!');
      return;
    }

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

    // TODO: Replace rebase with branch checkout + selective files checkout
    // To do that, we need `replexica@latest show files` to output the files that are under Replexica's management
    // and then we can use `git add` to add them.

    // Check if the branch already exists
    const branchExists = await octokit.rest.repos.getBranch({
      owner: config.repositoryOwner,
      repo: config.repositoryName,
      branch: prBranchName,
    })
      .then(({ data }) => data !== null)
      .catch(() => false);

    // If the branch exists, check it out
    if (branchExists) {
      ora.start(`Checking out branch ${prBranchName}`);
      execSync(`git fetch origin ${prBranchName}`);
      execSync(`git checkout ${prBranchName}`);
      ora.succeed(`Checked out branch ${prBranchName}`);
    } else {
      // If the branch does not exist, create it and set upstream for it
      ora.start(`Creating branch ${prBranchName}`);
      execSync(`git checkout -b ${prBranchName}`);
      ora.succeed(`Created branch ${prBranchName}`);
    }

    // Call `replexica@latest show files` and combine the output with selective checkout using xargs
    ora.start(`Pulling files Replexica is managing from the ${config.currentBranchName} branch`);
    execSync(`npx replexica@latest show files | xargs git checkout ${config.currentBranchName} -- `, { stdio: 'inherit' });
    ora.succeed('Files pulled');

    // Do stuff
    ora.start('Doing stuff');
    execSync(`npx replexica@latest i18n --api-key ${config.replexicaApiKey}`, { stdio: 'inherit' });
    ora.succeed('Done doing stuff');

    // Check if there are any changes made to the files
    const changes = execSync('git status --porcelain').toString();
    if (changes.length === 0) {
      ora.info('Translations are up to date!');
      return;
    }

    ora.start('Committing changes');
    execSync('git add .');
    execSync(`git commit -m "${config.commitMessage}"`);
    ora.succeed('Changes committed');

    ora.start('Pushing changes to remote');
    execSync(`git push --set-upstream origin "${prBranchName}"`);
    ora.succeed('Changes pushed to remote');

    // Check if PR already exists
    ora.start('Checking if PR already exists');
    let pullRequestNumber = await octokit.rest.pulls.list({
      owner: config.repositoryOwner,
      repo: config.repositoryName,
      head: prBranchName,
      base: config.currentBranchName,
    }).then(({ data }) => data[0]?.number);
    ora.succeed(`PR ${pullRequestNumber ? 'exists' : 'does not exist'}`);

    if (pullRequestNumber) {
      ora.info('PR already exists. Skipping PR creation.');
    } else {
      ora.start('Creating PR');
      pullRequestNumber = await octokit.rest.pulls.create({
        owner: config.repositoryOwner,
        repo: config.repositoryName,
        head: prBranchName,
        base: config.currentBranchName,
        title: config.pullRequestTitle,
      }).then(({ data }) => data.number);
      ora.succeed('PR created');
    }

    // TODO: Run workflow again
    const labelName = 'i18n';
    // Remove label if it exists
    const labelExists = await octokit.rest.issues.listLabelsOnIssue({
      owner: config.repositoryOwner,
      repo: config.repositoryName,
      issue_number: pullRequestNumber,
    }).then(({ data }) => data.some((label) => label.name === labelName));
    if (labelExists) {
      await octokit.rest.issues.removeLabel({
        owner: config.repositoryOwner,
        repo: config.repositoryName,
        issue_number: pullRequestNumber,
        name: labelName,
      });
    }
    // Add label
    await octokit.rest.issues.addLabels({
      owner: config.repositoryOwner,
      repo: config.repositoryName,
      issue_number: pullRequestNumber,
      labels: [labelName],
    });
  }
})();
