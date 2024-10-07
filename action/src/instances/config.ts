import loadEnv from './_env';

export default async function loadConfig() {
  const env = await loadEnv();

  return {
    isPullRequestMode: env.REPLEXICA_PULL_REQUEST,
    commitMessageText: env.REPLEXICA_COMMIT_MESSAGE,
  };
}