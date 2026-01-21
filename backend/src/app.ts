import { Elysia } from 'elysia';
import { initDB } from './db/initDB.js';
import { authRoutes } from './routes/auth.js';

initDB();

export const app = new Elysia()
  .get('/', () => `Hello, Elysia!`)
  .use(authRoutes);
