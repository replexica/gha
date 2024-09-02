# Container image that runs your code
FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm

# Copies your code file from your action repository to the filesystem path `/` of the container
COPY package.json pnpm-lock.yaml index.mjs ./

# Install dependencies
RUN pnpm install

# Run the script
ENTRYPOINT ["pnpm", "start"]
