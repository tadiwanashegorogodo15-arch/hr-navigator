# PeopleFlow Server

This folder contains a starter Node.js + Express backend for the PeopleFlow HR app.

Quick start:

1. Copy `.env.example` to `.env` and fill DATABASE_URL and SESSION_SECRET.
2. Install dependencies:
   ```bash
   cd server
   npm install
   ```
3. Generate Prisma client and run migration:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```
4. Start the server in development:
   ```bash
   npm run dev
   ```

The API endpoints:
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET  /api/employees
- POST /api/employees
- PUT  /api/employees/:id
- DELETE /api/employees/:id
- GET  /api/tickets
- POST /api/tickets

Session-based authentication is enabled using express-session and a PostgreSQL session store.
