import loadEnv from './_env.js';

export default async function loadConfig() {
  const env = await loadEnv();

  console.log(`Length of the replexica api key: ${env.REPLEXICA_API_KEY.length}`);

  return {
    replexicaApiKey: env.REPLEXICA_API_KEY,
    isPullRequestMode: env.REPLEXICA_PULL_REQUEST,
    commitMessage: env.REPLEXICA_COMMIT_MESSAGE,
    pullRequestTitle: env.REPLEXICA_PULL_REQUEST_TITLE,
    currentBranchName: env.GITHUB_REF_NAME,
    repositoryOwner: env.GITHUB_REPOSITORY_OWNER,
    repositoryFullName: env.GITHUB_REPOSITORY,
    repositoryName: env.GITHUB_REPOSITORY.split('/')[1],
  };
}
