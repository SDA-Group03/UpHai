import { initDB, seedDB } from './db/initdb.js';
import { app } from './app.js';
import { PORT } from './config/env.ts';

app.listen(PORT);
console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

