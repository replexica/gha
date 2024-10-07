import { exec, execSync } from 'child_process';
import Ora from 'ora';

import loadConfig from './instances/config.js';
// Uses GitHub's official Octokit
import loadOctokit from './instances/octokit.js';
import doStuff from './do-stuff.js';

// Run

(async function main() {
  const ora = Ora();

  try {
    const config = await loadConfig();
    const octokit = await loadOctokit();

    // Configure git
    ora.start('Configuring git');
    execSync('git config --global user.name "Replexica"');
    execSync('git config --global user.email "support@replexica.com"');
    execSync(`git config --global safe.directory ${process.cwd()}`);
    ora.succeed('Git configured');

    ora.start('Pulling latest changes from remote');
    execSync('git pull', { stdio: 'inherit' });
    ora.succeed('Pulled latest changes from remote');

    if (!config.isPullRequestMode) {
      ora.info('Pull request mode is disabled');

      // Do stuff
      ora.start('Doing stuff');
      await doStuff();
      ora.succeed('Done doing stuff');

      ora.start('Committing changes');
      execSync('git add .');
      execSync(`git commit -m "${config.commitMessage}"`);
      ora.succeed('Changes committed');

      ora.start('Pushing changes to remote');
      execSync('git push');
      ora.succeed('Changes pushed to remote');
    } else {
      ora.info('Pull request mode is enabled');
      // Calculate automated branch name
      ora.info('Calculating automated branch name');
      const prBranchName = `replexica/${config.currentBranchName}`;
      ora.succeed(`Automated branch name calculated: ${prBranchName}`);

      // Check if branch exists
      ora.start(`Checking if branch ${prBranchName} exists`);
      const branchExists = await octokit.rest.repos.getBranch({
        owner: config.repositoryOwner,
        repo: config.repositoryName,
        branch: prBranchName,
      }).then(({ data }) => data.commit !== null);
      ora.succeed(`Branch ${prBranchName} exists: ${branchExists}`);

      if (branchExists) {
        ora.info(`Branch ${prBranchName} exists, checking out`);
        execSync(`git fetch origin ${prBranchName}`);
        execSync(`git checkout ${prBranchName}`);
        ora.succeed(`Branch ${prBranchName} checked out`);

        ora.start('Rebasing latest changes from current branch');
        execSync(`git fetch origin ${config.currentBranchName}`);
        execSync(`git rebase ${config.currentBranchName} ${prBranchName}`, { stdio: 'inherit' });
        ora.succeed('Rebased latest changes from current branch');
      }

      // Do stuff
      ora.start('Doing stuff');
      await doStuff();
      ora.succeed('Done doing stuff');

      ora.start('Committing changes');
      execSync('git add .');
      execSync(`git commit -m "${config.commitMessage}"`);
      ora.succeed('Changes committed');

      ora.start('Pushing changes to remote');
      execSync(`git push --set-upstream origin "${prBranchName}"`);
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
  } catch (error: any) {
    ora.fail(error);
    process.exit(1);
  }
})();
