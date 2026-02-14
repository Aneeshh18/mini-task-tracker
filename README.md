# Mini Task Tracker

Full-stack task tracker with:
- Backend: Node.js + TypeScript + Express + Mongoose + Redis + Jest
- Frontend: Next.js (App Router)

## Project Structure

- `backend` - REST API, auth, tasks, caching, tests
- `frontend` - login/signup + dashboard with task CRUD

## Backend Setup

### Start MongoDB + Redis with Docker
From repo root:
```bash
docker compose up -d
```

This starts:
- MongoDB on `127.0.0.1:27017`
- Redis on `127.0.0.1:6379`

To stop:
```bash
docker compose down
```

To stop and remove volumes (fresh DB/cache):
```bash
docker compose down -v
```

1. Install dependencies:
```bash
cd backend
npm install
```
2. Create env file:
```bash
cp .env.example .env
```
3. Run dev server:
```bash
npm run dev
```
4. Build and run production server:
```bash
npm run build
npm start
```

### Backend Scripts
- `npm run dev` - start backend in watch mode
- `npm run build` - compile TypeScript to `dist`
- `npm start` - run compiled server
- `npm test` - run unit + integration tests
- `npm run test:coverage` - generate coverage report

### Backend API

Auth:
- `POST /api/auth/signup`
- `POST /api/auth/login`

Tasks (JWT required):
- `GET /api/tasks`
- `POST /api/tasks`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`

Health:
- `GET /health`

## Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```
2. Create env file:
```bash
cp .env.example .env.local
```
3. Run dev server:
```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

### backend/.env
- `PORT` - backend port (default `5000`)
- `MONGO_URI` - MongoDB connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - secret for signing JWT tokens
- `JWT_EXPIRES_IN` - token expiration, e.g. `7d`
- `CACHE_TTL_SECONDS` - task cache TTL per user

### frontend/.env.local
- `NEXT_PUBLIC_API_URL` - backend base URL, e.g. `http://localhost:5000`

## Notes

- Passwords are hashed with bcrypt.
- Task list responses are cached in Redis per user (`tasks:<userId>`).
- Cache is invalidated on task create/update/delete.
- Task schema index is set for `owner` and `{ owner, status }`.
- Tests include integration tests with `mongodb-memory-server` and mocked Redis client.
