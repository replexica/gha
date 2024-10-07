import loadEnv from './_env';
import { Octokit } from 'octokit';

export default async function loadOctokit() {
  const env = await loadEnv();
  return new Octokit({ auth: env.GH_TOKEN });
}