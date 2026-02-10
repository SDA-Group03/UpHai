import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { logger } from '@bogeychan/elysia-logger'; // <-- เพิ่ม: ตัวจัดการ log
import { authRoutes } from './routes/auth.ts';
import { dockerRoutes } from './routes/dockerRoutes.ts';
import { modelRoutes } from './routes/modelRoutes.ts';
import { whisperProxyRoutes } from './routes/whisperProxyRoutes.ts';
import { ollamaProxyRoutes } from './routes/ollamaProxyRoutes.ts';
import { apiKeyRoutes } from './routes/apiKeyRoutes.ts';
import { CORS_ORIGIN } from './config/env.ts';

export const app = new Elysia()
//   // ==================================
//  .use(logger()) 

//   .onBeforeHandle(({ request, body }) => {
//     if (body) {
//       console.log(`📦 [Request Body to ${new URL(request.url).pathname}]:`, JSON.stringify(body, null, 2));
//     }
//   })
//   .onAfterResponse(({ path, response }) => {
//     if (response && typeof response === 'object') {
//       console.log(`✨ [Response from ${path}]:`, JSON.stringify(response, null, 2));
//     } else {
//       console.log(`✨ [Response from ${path}]:`, response);
//     }
//   })
//   // ==================================
  .use(cors({
    origin: CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }))
  .get('/', () => `Hello, Elysia!`)
  .use(authRoutes)
  .use(dockerRoutes)
  .use(modelRoutes)
  .use(whisperProxyRoutes)
  .use(ollamaProxyRoutes)
  .use(apiKeyRoutes);