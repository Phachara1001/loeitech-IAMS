# Backend Setup Guide

> เอกสารนี้ใช้เป็นแนวทางในการสร้างและรัน Backend สำหรับระบบ Asset & Inventory Management System

---

# Project Structure

โครงสร้างโปรเจกต์ทั้งหมด

```text
loeitech-IAMS/

├── frontend/
│
├── backend/
│
├── docker/
│   └── docker-compose.yml
│
├── docs/
│
└── README.md
```

---

# Technology Stack

Backend ต้องใช้เทคโนโลยีดังนี้

* Node.js LTS
* Express.js
* PostgreSQL
* Prisma ORM
* MinIO
* Docker
* JWT
* bcrypt
* Multer
* Swagger
* dotenv
* Helmet
* Morgan
* CORS

---

# Step 1 : Create Backend Project

สร้างโฟลเดอร์ Backend

```bash
mkdir backend
cd backend
```

สร้าง Project

```bash
npm init -y
```

---

# Step 2 : Install Dependencies

Production

```bash
npm install express cors dotenv helmet morgan jsonwebtoken bcrypt multer minio @prisma/client swagger-ui-express swagger-jsdoc
```

Development

```bash
npm install -D prisma nodemon
```

---

# Step 3 : Configure package.json

เพิ่ม Scripts

```json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  }
}
```

---

# Step 4 : Create Project Structure

```
backend/

src/

├── config/
├── controllers/
├── middleware/
├── repositories/
├── routes/
├── services/
├── validations/
├── utils/
├── prisma/

├── app.js
└── server.js

package.json
Dockerfile
.env.example
.gitignore
README.md
```

---

# Step 5 : Initialize Prisma

สร้าง Prisma

```bash
npx prisma init
```

แก้ไข datasource

```prisma
datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
}

generator client {
    provider = "prisma-client-js"
}
```

---

# Step 6 : Create Environment File

AI ต้องสร้างไฟล์

```
.env.example
```

ห้ามสร้างไฟล์

```
.env
```

ผู้พัฒนาจะสร้างเองด้วยคำสั่ง

```bash
cp .env.example .env
```

ตัวอย่าง

```env
NODE_ENV=development

PORT=3000

DATABASE_URL=postgresql://postgres:password@postgres:5432/assetdb

JWT_SECRET=CHANGE_THIS_SECRET
JWT_REFRESH_SECRET=CHANGE_THIS_REFRESH_SECRET

MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_USE_SSL=false

MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=password123

MINIO_BUCKET=asset-files

FRONTEND_URL=http://localhost:5173

SWAGGER_ENABLED=true
```

---

# Step 7 : Create .gitignore

สร้างไฟล์

```gitignore
node_modules
.env
dist
coverage
logs
*.log

.vscode
.idea
```

---

# Step 8 : Docker

สร้างไฟล์

```
docker/docker-compose.yml
```

ต้องมี Service ดังนี้

* PostgreSQL
* MinIO

สามารถรันได้ด้วย

```bash
docker compose up -d
```

ตรวจสอบ Container

```bash
docker ps
```

---

# Step 9 : Database

สร้าง Migration

```bash
npx prisma migrate dev --name init
```

Generate Prisma Client

```bash
npx prisma generate
```

---

# Step 10 : Run Backend

เริ่มต้น Backend

```bash
npm run dev
```

ระบบต้องทำงานที่

```
http://localhost:3000
```

Swagger

```
http://localhost:3000/api/docs
```

---

# Database Management

ใช้ PostgreSQL ผ่าน Docker

ไม่ต้องติดตั้ง PostgreSQL ลงเครื่อง

แนะนำใช้โปรแกรม

## DBeaver Community

ใช้สำหรับ

* ดูฐานข้อมูล
* เพิ่มข้อมูล
* แก้ไขข้อมูล
* ลบข้อมูล
* เขียน SQL
* Export
* Import
* ดู ER Diagram

Connection

```
Host

localhost

Port

5432

Database

assetdb

Username

postgres

Password

password
```

เมื่อเชื่อมต่อสำเร็จจะสามารถดู

* users
* departments
* items
* assets
* locations
* stock_transactions
* activity_logs

ได้ทั้งหมด

---

# Prisma Studio

สำหรับจัดการข้อมูลผ่าน Web Browser

รัน

```bash
npx prisma studio
```

เปิด

```
http://localhost:5555
```

สามารถ

* เพิ่มข้อมูล
* แก้ไขข้อมูล
* ลบข้อมูล

ได้โดยไม่ต้องเขียน SQL

---

# MinIO

เปิด Console

```
http://localhost:9001
```

Login

```
Username

admin

Password

password123
```

สร้าง Bucket

```
asset-files
```

ใช้เก็บ

* รูปภาพ
* PDF
* Word
* Excel
* เอกสารแนบ

ห้ามเก็บไฟล์ Binary ลง PostgreSQL

---

# Development Workflow

ทุกครั้งที่เริ่มทำงาน

## 1. เปิด Docker

```bash
docker compose up -d
```

---

## 2. เข้า Backend

```bash
cd backend
```

---

## 3. ตรวจสอบ Environment

หากยังไม่มี

```
.env
```

ให้สร้าง

```bash
cp .env.example .env
```

---

## 4. Generate Prisma

```bash
npm run prisma:generate
```

---

## 5. Migration

กรณีมีการเปลี่ยน Schema

```bash
npm run prisma:migrate
```

---

## 6. Run Backend

```bash
npm run dev
```

---

## 7. ตรวจสอบ API

เปิด

```
http://localhost:3000/api/docs
```

---

## 8. เปิด DBeaver

เชื่อมต่อ PostgreSQL

ตรวจสอบข้อมูล

---

## 9. เปิด MinIO

```
http://localhost:9001
```

ตรวจสอบไฟล์

---

## 10. เปิด Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend

```
http://localhost:5173
```

Backend

```
http://localhost:3000
```

Database

```
localhost:5432
```

MinIO API

```
localhost:9000
```

MinIO Console

```
localhost:9001
```

Swagger

```
http://localhost:3000/api/docs
```

Prisma Studio

```
http://localhost:5555
```

---

# Development Rules

* ใช้ ES Module
* ใช้ Async/Await
* ใช้ MVC Architecture
* ใช้ Repository Pattern
* ใช้ Service Layer
* ใช้ Prisma ORM
* ใช้ PostgreSQL
* ใช้ MinIO สำหรับจัดเก็บไฟล์
* ใช้ JWT Authentication
* ใช้ dotenv สำหรับ Environment Variables
* ห้าม Hardcode Password หรือ Secret
* ทุก API ต้องมี Validation
* ทุก API ต้องมี Error Handling
* ทุก API ต้องมี Swagger Documentation
* โค้ดต้องพร้อมสำหรับ Production และสามารถขยายระบบได้ในอนาคต

---

# Git Pull Workflow (เมื่อมีการอัปเดตโค้ด)

ถ้าเพื่อนในทีม (หรือตัวคุณเอง) ทำการ Pull โค้ดโปรเจกต์นี้ลงมาที่เครื่อง สิ่งที่ต้องทำเพื่อให้ระบบรันได้สมบูรณ์มีขั้นตอนดังนี้:

## 1. ติดตั้ง Dependencies ใหม่
หากมีการเพิ่ม Library ใหม่ๆ ต้องลงก่อนเสมอ
```bash
cd backend
npm install
```

## 2. ตรวจสอบไฟล์ Environment (ถ้ายังไม่มี)
ถ้าเป็นการ Clone ลงมาครั้งแรก ต้องทำการก็อปปี้ `.env` (ถ้ามีอยู่แล้วไม่ต้องทำ)
```bash
cp .env.example .env
```

## 3. เปิด Docker
เพื่อให้ฐานข้อมูล PostgreSQL และ MinIO พร้อมใช้งาน
```bash
cd docker
docker compose up -d
```

## 4. ซิงค์ Database และ Prisma Client
เพื่อให้โครงสร้างฐานข้อมูลตรงกับโค้ดล่าสุด และอัปเดต Prisma Client
```bash
cd backend
npm run prisma:migrate
npm run prisma:generate
```

## 5. รันเซิร์ฟเวอร์
เริ่มรันโค้ดและทำงานได้ตามปกติ
```bash
npm run dev
```
