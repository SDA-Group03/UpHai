import { initDB, seedDB } from './src/db/initdb.js';
import { app } from './src/app.js';
import { PORT } from './src/config/env.ts';

app.listen(PORT);
console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`);