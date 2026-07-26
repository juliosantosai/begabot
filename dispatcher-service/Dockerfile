FROM node:18-alpine
WORKDIR /app/dispatcher-service
COPY dispatcher-service/package*.json ./
RUN npm install --production --silent
COPY dispatcher-service ./
EXPOSE 3007
CMD ["node", "server.js"]
