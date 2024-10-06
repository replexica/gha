import loadConfig from './instances/config.mjs';
// Uses SimpleGit
import loadGit from './instances/git.mjs';
// Uses GitHub's official Octokit
import loadOctokit from './instances/octokit.mjs';
import doStuff from './do-stuff.mjs';

const config = await loadConfig();
const git = await loadGit();
const octokit = await loadOctokit();

// Run

console.log(process.cwd());
// Do stuff
await doStuff();
// Commit changes
import { execSync } from 'child_process';

execSync('git add .');
execSync('git commit -m "feat: update data"');
execSync('git push');
