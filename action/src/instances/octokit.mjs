import env from './_env.mjs';
import { Octokit } from 'octokit';

export default async function loadOctokit() {
  return new Octokit({ auth: env.GH_TOKEN });
}