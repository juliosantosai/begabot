FROM node:18-alpine
WORKDIR /app/core-service
COPY core-service/package*.json ./
COPY core-service/prisma ./prisma
COPY packages/shared-contracts ../packages/shared-contracts
RUN npm install --production --silent && npx prisma generate --schema=./prisma/schema.prisma
COPY core-service ./
EXPOSE 3002
CMD ["node", "index.js"]
