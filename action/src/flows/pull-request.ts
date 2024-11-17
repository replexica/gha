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

      this.ora.start(`Syncing with ${this.config.baseBranchName}`);
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
    const pullRequestNumber = await this.ensureFreshPr(this.i18nBranchName);
    // await this.createLabelIfNotExists(pullRequestNumber, 'replexica/i18n', false);
    this.ora.succeed(`Pull request ready: https://github.com/${this.config.repositoryOwner}/${this.config.repositoryName}/pull/${pullRequestNumber}`);
  }


  private calculatePrBranchName(): string {
    return `replexica/${this.config.baseBranchName}`;
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

  private async ensureFreshPr(i18nBranchName: string) {
    // Check if PR exists
    const existingPr = await this.octokit.rest.pulls.list({
      owner: this.config.repositoryOwner,
      repo: this.config.repositoryName,
      head: `${this.config.repositoryOwner}:${i18nBranchName}`,
      base: this.config.baseBranchName,
      state: 'open',
    }).then(({ data }) => data[0]);

    if (existingPr) {      
      // Close existing PR first
      await this.octokit.rest.pulls.update({
        owner: this.config.repositoryOwner,
        repo: this.config.repositoryName,
        pull_number: existingPr.number,
        state: 'closed'
      });
    }

    // Create new PR
    const newPr = await this.octokit.rest.pulls.create({
      owner: this.config.repositoryOwner,
      repo: this.config.repositoryName,
      head: i18nBranchName,
      base: this.config.baseBranchName,
      title: this.config.pullRequestTitle,
      body: this.getPrBodyContent(),
    });

    if (existingPr) {
      // Post comment about outdated PR
      await this.octokit.rest.issues.createComment({
        owner: this.config.repositoryOwner,
        repo: this.config.repositoryName,
        issue_number: existingPr.number,
        body: `This PR is now outdated. A new version has been created at #${newPr.data.number}`
      });
    }

    return newPr.data.number;
  }

  private async createLabelIfNotExists(pullRequestNumber: number, labelName: string, recreate: boolean) {
    // Check if label exists
    const existingLabel = await this.octokit.rest.issues.listLabelsOnIssue({
      owner: this.config.repositoryOwner,
      repo: this.config.repositoryName,
      issue_number: pullRequestNumber,
    }).then(({ data }) => data.find(label => label.name === labelName));

    if (existingLabel) {
      if (!recreate) {
        return;
      }
      
      // Remove existing label first
      await this.octokit.rest.issues.removeLabel({
        owner: this.config.repositoryOwner,
        repo: this.config.repositoryName,
        issue_number: pullRequestNumber,
        name: labelName
      });
    }

    // Add new label
    await this.octokit.rest.issues.addLabels({
      owner: this.config.repositoryOwner,
      repo: this.config.repositoryName,
      issue_number: pullRequestNumber,
      labels: [labelName]
    });
  }

  private checkoutI18nBranch(i18nBranchName: string) {
    execSync(`git fetch origin ${i18nBranchName}`, { stdio: 'inherit' });
    execSync(`git checkout ${i18nBranchName}`, { stdio: 'inherit' });
  }

  private createI18nBranch(i18nBranchName: string) {
    execSync(`git fetch origin ${this.config.baseBranchName}`, { stdio: 'inherit' });
    execSync(`git checkout -b ${i18nBranchName} origin/${this.config.baseBranchName}`, { stdio: 'inherit' });
  }

  private syncI18nBranch() {
    if (!this.i18nBranchName) {
      throw new Error('i18nBranchName is not set');
    }

    // Fetch latest changes from base branch
    execSync(`git fetch origin ${this.config.baseBranchName}`, { stdio: 'inherit' });
    
    // Rebase on base branch, taking their changes in case of conflicts
    execSync(`git rebase origin/${this.config.baseBranchName} --strategy-option=theirs`, { stdio: 'inherit' });

    // Check if there are any changes to commit
    const hasChanges = this.checkCommitableChanges();
    if (hasChanges) {
      execSync(`git commit -am "chore: sync with ${this.config.baseBranchName}"`, { stdio: 'inherit' });
    }
  }

  private getPrBodyContent(): string {
    return `
Hey team,

[**Replexica AI**](https://replexica.com) here with fresh localization updates!

### What's New?

- Added missing translations
- Improved localization coverage

### Next Steps

- [ ] Review the changes
- [ ] Merge when ready
    `.trim();
  }
}
