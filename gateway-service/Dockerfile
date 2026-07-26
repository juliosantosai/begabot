FROM node:18-alpine
WORKDIR /app/gateway-service
COPY gateway-service/package*.json ./
COPY packages/shared-contracts ../packages/shared-contracts
RUN npm install --production --silent
COPY gateway-service ./
EXPOSE 3001
CMD ["node", "server.js"]
