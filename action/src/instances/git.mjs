import simpleGit from "simple-git";

export default async function loadGit() {
  return simpleGit({
    config: {
      user: {
        name: 'Replexica',
        email: 'support@replexica.com'
      },
      safeDirectory: process.cwd(),
    }
  });
}