FROM node:20-alpine AS builder
WORKDIR /app
# คัดลอกไฟล์ที่จำเป็นสำหรับการติดตั้ง dependencies ให้ชัดเจน
COPY package.json ./
COPY package-lock.json ./
RUN npm ci || npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
COPY package-lock.json ./
RUN npm ci --omit=dev || npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY server ./server
EXPOSE 3000
CMD ["node", "server/index.js"]
