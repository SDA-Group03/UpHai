import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { initDB } from './db/initDB.js';
import { authRoutes } from './routes/auth.js';

initDB();

export const app = new Elysia()
  .use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'], // Vite dev server and other origins
    credentials: true, // Important for cookies
  }))
  .get('/', () => `Hello, Elysia!`)
  .use(authRoutes);
