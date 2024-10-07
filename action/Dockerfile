FROM node:20.12.2-alpine

# Install git
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy necessary files
COPY package*.json /app

# Copy src directory
COPY src /app/src

# Install pnpm and dependencies
RUN npm install -g pnpm && pnpm install

RUN ls -la

# Run the Node.js application
ENTRYPOINT ["pnpm", "run", "start"]
