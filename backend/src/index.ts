import { initDB } from "./db/initdb.js";
import { app } from "./app.js";
import { PORT } from "./config/env.ts";
import { autoStopScheduler } from "./services/autoStopScheduler.js";

initDB();

app.listen(PORT);
console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

autoStopScheduler.start();
