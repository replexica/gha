import env from './_env.js';
import { Octokit } from 'octokit';

export default async function loadOctokit() {
  return new Octokit({ auth: env.GH_TOKEN });
}