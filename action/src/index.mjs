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

// Do stuff
await doStuff();
// Commit changes
await git.add('.');
await git.commit('feat: update data');
await git.push();
