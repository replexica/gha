import { execSync } from "child_process";
import { InBranchFlow } from "./in-branch.js";

export class PullRequestFlow extends InBranchFlow {
  private i18nBranchName?: string;

  async preRun() {
    await super.preRun?.();

    this.ora.start('Calculating automated branch name');
    this.i18nBranchName = this.calculatePrBranchName();
    this.ora.succeed(`Automated branch name calculated: ${this.i18nBranchName}`);

    this.ora.start('Checking if branch exists');
    const branchExists = await this.checkBranchExistance(this.i18nBranchName);
    this.ora.succeed(branchExists ? 'Branch exists' : 'Branch does not exist');

    if (branchExists) {
      this.ora.start(`Checking out branch ${this.i18nBranchName}`);
      this.checkoutI18nBranch(this.i18nBranchName);
      this.ora.succeed(`Checked out branch ${this.i18nBranchName}`);

      this.ora.start(`Syncing with ${this.config.currentBranchName}`);
      this.syncI18nBranch();
      this.ora.succeed(`Checked out and synced branch ${this.i18nBranchName}`);
    } else {
      this.ora.start(`Creating branch ${this.i18nBranchName}`);
      this.createI18nBranch(this.i18nBranchName);
      this.ora.succeed(`Created branch ${this.i18nBranchName}`);
    }
  }

  async postRun() {
    if (!this.i18nBranchName) { throw new Error('i18nBranchName is not set. Did you forget to call preRun?'); }

    this.ora.start('Checking if PR already exists');
    const pullRequestNumber = await this.createPrIfNotExists(this.i18nBranchName);
    this.ora.succeed(`Pull request ready: https://github.com/${this.config.repositoryOwner}/${this.config.repositoryName}/pull/${pullRequestNumber}`);

    this.ora.start('Adding label to PR');
    await this.addLabelToPr(pullRequestNumber);
    this.ora.succeed('Label added to PR');
  }


  private calculatePrBranchName(): string {
    return `replexica/${this.config.currentBranchName}`;
  }

  private async checkBranchExistance(prBranchName: string) {
    const result = await this.octokit.rest.repos.getBranch({
      owner: this.config.repositoryOwner,
      repo: this.config.repositoryName,
      branch: prBranchName,
    })
      .then((r) => r.data)
      .catch((r) => r.status === 404 ? false : Promise.reject(r));

    return result;
  }

  private async createPrIfNotExists(i18nBranchName: string) {
    let pullRequestNumber = await this.octokit.rest.pulls.list({
      owner: this.config.repositoryOwner,
      repo: this.config.repositoryName,
      head: i18nBranchName,
      base: this.config.currentBranchName,
    }).then(({ data }) => data[0]?.number);

    if (pullRequestNumber) {
      return pullRequestNumber;
    } else {
      return await this.octokit.rest.pulls.create({
        owner: this.config.repositoryOwner,
        repo: this.config.repositoryName,
        head: this.i18nBranchName!,
        base: this.config.currentBranchName,
        title: this.config.pullRequestTitle,
      }).then(({ data }) => data.number);
    }
  }

  private async addLabelToPr(pullRequestNumber: number) {
    // TODO: Run workflow again
    const labelName = 'replexica/i18n';
    // Remove label if it exists
    const labelExists = await this.octokit.rest.issues.listLabelsOnIssue({
      owner: this.config.repositoryOwner,
      repo: this.config.repositoryName,
      issue_number: pullRequestNumber,
    }).then(({ data }) => data.some((label) => label.name === labelName));
    if (labelExists) {
      await this.octokit.rest.issues.removeLabel({
        owner: this.config.repositoryOwner,
        repo: this.config.repositoryName,
        issue_number: pullRequestNumber,
        name: labelName,
      });
    }
    // Add label
    await this.octokit.rest.issues.addLabels({
      owner: this.config.repositoryOwner,
      repo: this.config.repositoryName,
      issue_number: pullRequestNumber,
      labels: [labelName],
    });
  }

  private checkoutI18nBranch(i18nBranchName: string) {
    execSync(`git fetch origin ${i18nBranchName}`, { stdio: 'inherit' });
    execSync(`git checkout ${i18nBranchName}`, { stdio: 'inherit' });
  }

  private createI18nBranch(i18nBranchName: string) {
    execSync(`git fetch origin ${this.config.currentBranchName}`, { stdio: 'inherit' });
    execSync(`git checkout -b ${i18nBranchName} origin/${this.config.currentBranchName}`, { stdio: 'inherit' });
  }

  private syncI18nBranch() {
    execSync(`git fetch origin ${this.config.currentBranchName}`, { stdio: 'inherit' });

    // Get list of files to preserve
    const filesToPreserve = ['i18n.lock'];
    try {
      const replexicaFiles = execSync('npx replexica@latest show files --target', { encoding: 'utf8' })
        .split('\n')
        .filter(Boolean); // Remove empty lines
      filesToPreserve.push(...replexicaFiles);
    } catch (error) {
      this.ora.warn('Could not get Replexica target files list, preserving only i18n.lock');
    }

    // Merge but don't commit yet
    execSync(`git merge -X theirs --no-commit origin/${this.config.currentBranchName} --allow-unrelated-histories`, { stdio: 'inherit' });

    // Restore all files that need to be preserved
    for (const file of filesToPreserve) {
      try {
        execSync(`git checkout HEAD -- "${file}"`, { stdio: 'inherit' });
      } catch (error) {
        this.ora.warn(`Could not preserve ${file} (might not exist)`);
      }
    }

    execSync('git commit -m "Merge branch with preserved Replexica files"', { stdio: 'inherit' });
  }
}