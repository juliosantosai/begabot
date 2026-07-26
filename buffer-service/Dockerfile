FROM node:18-alpine
WORKDIR /app/buffer-service
COPY buffer-service/package*.json ./
RUN npm install --production --silent
COPY buffer-service ./
EXPOSE 3000
CMD ["node", "server.js"]
