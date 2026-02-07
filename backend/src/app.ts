import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { authRoutes } from './routes/auth.ts';
import { dockerRoutes } from './routes/dockerRoutes.ts';
import { modelRoutes } from './routes/modelRoutes.ts';
import { CORS_ORIGIN } from './config/env.ts';

export const app = new Elysia()
  .use(cors({
    origin: CORS_ORIGIN,
    credentials: true, // Important for cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }))
  .get('/', () => `Hello, Elysia!`)
  .use(authRoutes)
  .use(dockerRoutes)
  .use(modelRoutes)