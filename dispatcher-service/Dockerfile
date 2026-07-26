FROM node:18-alpine
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --production --silent

COPY . .
EXPOSE 3007
CMD ["node", "server.js"]
