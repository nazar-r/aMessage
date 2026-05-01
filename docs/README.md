# TypeScript Messaging App (React + NestJS + PostgreSQL)

Full-stack instant messaging platform featuring private chats, real-time updates, and a clean responsive UI.

![TypeScript](https://img.shields.io/badge/TypeScript-black)
![React](https://img.shields.io/badge/React-18-black)
![NestJS](https://img.shields.io/badge/NestJS-black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-black)
![Socket.io](https://img.shields.io/badge/Socket.io-black)
![pnpm](https://img.shields.io/badge/pnpm-black)


## ✨ Features

- ✅ **User Authentication** – Register, login, logout (JWT + refresh tokens)
- ✅ **OAuth 2.0** – Sign in with Google or GitHub
- ✅ **Real-time Messaging** – One-on-one private chats via Socket.io
- ✅ **Message History** – Persistent storage with PostgreSQL
- ✅ **Online / Offline Status** – Live presence tracking
- ✅ **Responsive Design** – Mobile-first UI
- ✅ **Protected Routes** – Secured frontend & backend
- ✅ **End-to-End Encryption** – Secure messaging
- ✅ **Input Validation** – Zod + class-validator


## 🛠 Tech Stack

### Frontend (`../src/src.app`)
- React 18 + Vite + TypeScript
- CSS
- Socket.io Client
- TanStack Query
- React Router v7
- Libsodium

### Backend (`../src/src.server`)
- NestJS (TypeScript)
- PostgreSQL + Prisma ORM
- Socket.io
- JWT Authentication (Passport + JWT)
- OAuth 2.0
- class-validator + class-transformer
- Redis

### Database
- PostgreSQL 16


## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/nazar-r/aMessage.git
cd aMessage
```

### 2. Secret Files Structure (`../src/src.server/.env`)

```
DATABASE_URL="" 
DIRECT_URL="" 
REDIS_URL="" 
JWT_SECRET="" 

GOOGLE_CLIENT_ID="" 
GOOGLE_CLIENT_SECRET="" 
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/redirect 

GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET="" 
GITHUB_CALLBACK_URL=http://localhost:3001/auth/github/redirect
```

Fill `.env` according to your values.

### 3. Frontend Setup

```bash
cd src
cd src.app
pnpm install
```
Start frontend:
```
pnpm run dev
```
Open in browser:  
```
http://localhost:5174
```

### 4. Backend Setup

```bash
cd src
cd src.server
pnpm install
```
Generate Prisma client & run migrations:

```bash
npx prisma generate
npx prisma migrate dev
npx prisma init
```

Start backend:

```bash
pnpm start:dev
```

Server will run at:
```
http://localhost:3001
```

## 🧪 Optional Scripts

```
pnpm build # production build 
pnpm start:prod # run built app 
npx prisma studio # open Prisma Studio
```
### ⭐ Show Your Support! If you like this project, give it a star ⭐
