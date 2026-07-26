FROM node:18-alpine
WORKDIR /app/servicio-core
COPY servicio-core/package*.json ./
COPY servicio-core/prisma ./prisma
COPY packages/shared-contracts ../packages/shared-contracts
RUN npm install --production --silent && npx prisma generate --schema=./prisma/schema.prisma
COPY servicio-core ./
EXPOSE 3002
CMD ["node", "index.js"]
