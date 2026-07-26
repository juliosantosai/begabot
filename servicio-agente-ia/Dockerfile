FROM node:18-alpine
WORKDIR /app/servicio-agente-ia
COPY servicio-agente-ia/package*.json ./
COPY packages/shared-contracts ../packages/shared-contracts
RUN npm install --production --silent
COPY servicio-agente-ia ./
EXPOSE 3003
CMD ["node", "server.js"]
