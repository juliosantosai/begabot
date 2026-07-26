FROM node:18-alpine
WORKDIR /app/media-switcher-service
COPY media-switcher-service/package*.json ./
RUN npm install --production --silent
COPY media-switcher-service ./
EXPOSE 3004
CMD ["node", "server.js"]
