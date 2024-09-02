FROM node:20.12.2-alpine

# Set working directory
WORKDIR /

# Copy necessary files
COPY package*.json /

# Copy src directory
COPY src /src

# Install pnpm and dependencies
RUN npm install -g pnpm && pnpm install

# Run the Node.js application
ENTRYPOINT ["node", "/src/index.mjs"]
