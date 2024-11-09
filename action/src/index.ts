import { exec, execSync } from 'child_process';
import Ora from 'ora';

import loadConfig from './instances/config.js';
// Uses GitHub's official Octokit
import loadOctokit from './instances/octokit.js';

// Run

(async function main() {
  const ora = Ora();
  const config = await loadConfig();

  console.log(config);
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

    // Check if there's anything to commit
    try {
      const changes = execSync(
        'git status --porcelain',
        { encoding: 'utf8' }
      ).trim();

      if (!changes) {
        ora.info('Translations are up to date!');
        return;
      }

      ora.info(`Changes detected:\n${changes}`);
    } catch (error) {
      ora.fail('Failed to check git status');
      throw error;
    }

    ora.start('Committing changes');
    let didCommit = false;
    try {
      execSync(`git add .`, { stdio: 'inherit' });
      const hasChanges = execSync('git diff --staged --quiet || echo "has_changes"', { encoding: 'utf8' }).includes('has_changes');
      
      if (hasChanges) {
        execSync(`git commit -m "${config.commitMessage}"`, { stdio: 'inherit' });
        ora.succeed('Changes committed');
        didCommit = true;
      } else {
        ora.info('No changes to commit');
      }
    } catch (error) {
      ora.fail('Failed to commit changes');
      throw error;
    }

    if (didCommit) {
      ora.start('Pushing changes to remote');
      execSync('git push', { stdio: 'inherit' });
      ora.succeed('Changes pushed to remote');
    }
  } else {
    ora.info('Pull request mode is enabled');

    ora.info('Calculating automated branch name');
    const prBranchName = `replexica/${config.currentBranchName}`;
    ora.succeed(`Automated branch name calculated: ${prBranchName}`);

    // Check if the branch already exists
    const branchExists = await octokit.rest.repos.getBranch({
      owner: config.repositoryOwner,
      repo: config.repositoryName,
      branch: prBranchName,
    })
      .then((r) => r.data)
      .catch((r) => r.status === 404 ? false : Promise.reject(r));

    // If the branch exists, check it out
    if (branchExists) {
      ora.start(`Checking out branch ${prBranchName}`);
      execSync(`git fetch origin ${prBranchName}`, { stdio: 'inherit' });
      execSync(`git checkout ${prBranchName}`, { stdio: 'inherit' });
      ora.info(`Syncing with ${config.currentBranchName}`);
      execSync(`git fetch origin ${config.currentBranchName}`, { stdio: 'inherit' });
      // Use -X theirs to automatically resolve conflicts in favor of the other branch
      execSync(`git merge origin/${config.currentBranchName} -X theirs --allow-unrelated-histories`, { stdio: 'inherit' });
      // but use i18n.lock from our branch
      execSync(`git checkout ${prBranchName} -- i18n.lock`, { stdio: 'inherit' });
      ora.succeed(`Checked out and synced branch ${prBranchName}`);
    } else {
      // If the branch does not exist, create it from the current branch
      ora.start(`Creating branch ${prBranchName}`);
      execSync(`git fetch origin ${config.currentBranchName}`, { stdio: 'inherit' });
      execSync(`git checkout -b ${prBranchName} origin/${config.currentBranchName}`, { stdio: 'inherit' });
      ora.succeed(`Created branch ${prBranchName}`);
    }

    // Now we can safely check out specific files and make changes
    ora.start(`Pulling files from ${config.currentBranchName}`);
    // First, pull all files from the main branch
    execSync(`git checkout ${config.currentBranchName} -- .`, { stdio: 'inherit' });
    // Then restore i18n.lock from our branch (effectively undoing the checkout for this file)
    execSync(`git checkout HEAD -- i18n.lock`, { stdio: 'inherit' });
    ora.succeed('Files pulled');

    // Do stuff
    ora.start('Doing stuff');
    execSync(`npx replexica@latest i18n --api-key ${config.replexicaApiKey}`, { stdio: 'inherit' });
    ora.succeed('Done doing stuff');

    // Check if there's anything to commit
    try {
      const changes = execSync(
        'git status --porcelain',
        { encoding: 'utf8' }
      ).trim();

      if (!changes) {
        ora.info('Translations are up to date!');
        return;
      }

      ora.info(`Changes detected:\n${changes}`);
    } catch (error) {
      ora.fail('Failed to check git status');
      throw error;
    }

    ora.start('Committing changes');
    let didCommit = false;
    try {
      execSync(`git add .`, { stdio: 'inherit' });
      const hasChanges = execSync('git diff --staged --quiet || echo "has_changes"', { encoding: 'utf8' }).includes('has_changes');
      
      if (hasChanges) {
        execSync(`git commit -m "${config.commitMessage}"`, { stdio: 'inherit' });
        ora.succeed('Changes committed');
        didCommit = true;
      } else {
        ora.info('No changes to commit');
      }
    } catch (error) {
      ora.fail('Failed to commit changes');
      throw error;
    }

    if (didCommit) {
      ora.start('Pushing changes to remote');
      try {
        execSync(`git push --set-upstream origin "${prBranchName}"`, { stdio: 'inherit' });
      } catch (error) {
        ora.warn('Failed to push, attempting force push');
        execSync(`git push --force --set-upstream origin "${prBranchName}"`, { stdio: 'inherit' });
      }
      ora.succeed('Changes pushed to remote');
    }

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
    const labelName = 'replexica/i18n';
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
