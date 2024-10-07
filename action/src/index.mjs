import { execSync } from 'child_process';

import loadConfig from './instances/config.mjs';
// Uses GitHub's official Octokit
import loadOctokit from './instances/octokit.mjs';
import doStuff from './do-stuff.mjs';
import loadEnv from './instances/_env.mjs';

const env = await loadEnv();
const config = await loadConfig();
const octokit = await loadOctokit();

console.log(env);

// Run

// Do stuff
await doStuff();
// Commit changes
execSync('git config --global user.name "Replexica"');
execSync('git config --global user.email "support@replexica.com"');
execSync(`git config --global safe.directory ${process.cwd()}`);

execSync('git add .');
execSync(`git commit -m "${env.REPLEXICA_COMMIT_MESSAGE}"`);
execSync('git push');
