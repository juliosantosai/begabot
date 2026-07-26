FROM node:18-alpine
WORKDIR /app/audit-metrics-service
COPY audit-metrics-service/package*.json ./
RUN npm install --production --silent
COPY audit-metrics-service ./
EXPOSE 3005
CMD ["node", "server.js"]
