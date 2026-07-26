FROM node:18-alpine
WORKDIR /app/ai-agent-service
COPY ai-agent-service/package*.json ./
COPY packages/shared-contracts ../packages/shared-contracts
RUN npm install --production --silent
COPY ai-agent-service ./
EXPOSE 3008
CMD ["node", "server.js"]
