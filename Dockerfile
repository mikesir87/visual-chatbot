FROM node:22-slim AS base
WORKDIR /usr/local/app

FROM base AS build-react-app
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

FROM base AS sample-server
ENV NODE_ENV=production
COPY sample-mcp-server/package*.json ./
RUN npm install
COPY sample-mcp-server/src ./src


# Stage 2: Set up the backend server
FROM base AS backend
ENV NODE_ENV=production
COPY api/package*.json ./
RUN npm install && npm cache clean --force
COPY api/ ./

# Copy the built React app to the public directory of the backend
COPY --from=build-react-app /usr/local/app/dist /usr/local/app/public

COPY --from=sample-server --link /usr/local/app /usr/local/sample-mcp-server
COPY --from=docker --link /usr/local/bin/docker /usr/local/bin/docker

# Expose the port and start the server
EXPOSE 3000
CMD ["node", "src/index.mjs"]