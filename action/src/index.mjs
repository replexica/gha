import { execSync } from 'child_process';

import loadConfig from './instances/config.mjs';
// Uses GitHub's official Octokit
import loadOctokit from './instances/octokit.mjs';
import doStuff from './do-stuff.mjs';

const config = await loadConfig();
const git = await loadGit();
const octokit = await loadOctokit();

// Run

// Do stuff
await doStuff();
// Commit changes
execSync('git config --global user.name "Replexica"');
execSync('git config --global user.email "support@replexica.com"');
execSync(`git config --global safe.directory ${process.cwd()}`);

execSync('git add .');
execSync('git commit -m "feat: update data"');
execSync('git push');
