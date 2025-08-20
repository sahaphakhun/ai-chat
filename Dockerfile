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
RUN npm i -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["sh", "-c", "serve -s dist -l ${PORT:-3000}"]
