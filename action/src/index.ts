import { execSync } from 'child_process';

import loadConfig from './instances/config.js';
// Uses GitHub's official Octokit
import loadOctokit from './instances/octokit.js';
import doStuff from './do-stuff.js';

// Run

(async function main() {
  const config = await loadConfig();
  const octokit = await loadOctokit();

  // Do stuff
  await doStuff();
  // Commit changes
  execSync('git config --global user.name "Replexica"');
  execSync('git config --global user.email "support@replexica.com"');
  execSync(`git config --global safe.directory ${process.cwd()}`);

  execSync('git add .');
  execSync(`git commit -m "${config.commitMessageText}"`);
  execSync('git push');

})();