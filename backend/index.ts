import { app } from './src/app.js';
import { PORT } from './src/config/env.js';

app.listen(PORT);
console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

export { app };
