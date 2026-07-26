FROM node:18-alpine
WORKDIR /app/servicio-buffer
COPY servicio-buffer/package*.json ./
RUN npm install --production --silent
COPY servicio-buffer ./
EXPOSE 3001
CMD ["node", "server.js"]
