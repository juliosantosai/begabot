FROM node:18-alpine
WORKDIR /app/scheduler-service
COPY scheduler-service/package*.json ./
RUN npm install --production --silent
COPY scheduler-service ./
EXPOSE 3006
CMD ["node", "server.js"]
