import loadConfig from './instances/config.mjs';
// Uses SimpleGit
import loadGit from './instances/git.mjs';
// Uses GitHub's official Octokit
import loadOctokit from './instances/octokit.mjs';

const config = await loadConfig();
const git = await loadGit();
const octokit = await loadOctokit();

// Run

if (config.pullRequest) {
  const currentBranch = await detectCurrentBranch();
  await switchToTranslationsBranch(currentBranch);

  await produceTranslations();

  // await stashUnstagedChanges();
  // await syncTranslationsBranch();
  // await rebaseTranslationsBranch();
  // await unstashUnstagedChanges();

  await commitChanges();
  await pushChanges();

  await ensureTranslationsPullRequest();
} else {
  await produceTranslations();
  await commitChanges();
  await pushChanges();
}

const getTranslationsBranchName = (currentBranch) => `replexica/${currentBranch}`;

async function detectCurrentBranch() {
  return 'main';
}

async function switchToTranslationsBranch(currentBranch) {
  const translationsBranch = getTranslationsBranchName(currentBranch);
  // check if translations branch exists
  octokit.request('')
}

async function produceTranslations() {
  // for now, just create a new entry in the data.json file, where key is the iso timestamp, and value is an empty object
  // merge that into the existing data.json file, if it exists

  const dataFileExists = await fs.existsSync('data.json');
  const dataContent = dataFileExists ? await fs.readFileSync('data.json', 'utf8') : '{}';
  const data = JSON.parse(dataContent);

  const timestamp = new Date().toISOString();
  data[timestamp] = {};

  await fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
}

async function commitChanges() {
  await git.commit('feat: update translations');
}

async function pushChanges() {
  await git.push();
}