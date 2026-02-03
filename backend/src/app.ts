import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { initDB } from './db/initDB.js';
import { authRoutes } from './routes/auth.js';

initDB();

export const app = new Elysia()
  .use(cors({
    origin: true, // Allow all origins in development
    credentials: true, // Important for cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }))
  .get('/', () => `Hello, Elysia!`)
  .use(authRoutes);
