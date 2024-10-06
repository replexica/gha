import Z from 'zod';

export default async function loadEnv() {
  return Z.object({
    // Replexica
    REPLEXICA_API_KEY: Z.string(),
    REPLEXICA_VERSION: Z.string().optional().default('latest'),
    REPLEXICA_COMMIT_MESSAGE: Z.string().optional().default('feat: update translations'),
    REPLEXICA_PULL_REQUEST: Z.boolean().optional().default(false),
    REPLEXICA_PULL_REQUEST_TITLE: Z.string().optional().default('feat: update translations'),
    REPLEXICA_PULL_REQUEST_ASSIGNEES: Z.string().optional(),
    REPLEXICA_PULL_REQUEST_LABELS: Z.string().optional(),
    // Github
    GITHUB_REPOSITORY: Z.string(),
    GITHUB_REPOSITORY_OWNER: Z.string(),
    GITHUB_REF: Z.string(),
    GITHUB_REF_NAME: Z.string(),
    GITHUB_HEAD_REF: Z.string(),
    // Custom env
    GH_TOKEN: Z.string(),
  })
    .passthrough()
    .parse(process.env);
}