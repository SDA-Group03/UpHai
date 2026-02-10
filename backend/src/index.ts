// index.ts
import { initDB } from "./db/initdb.js";
import { app } from "./app.js";
import { PORT } from "./config/env.ts";
import { autoStopScheduler } from "./services/autoStopScheduler.js";

const start = async () => {
  try {
    await initDB();
    console.log("📂 Database initialized");

    autoStopScheduler.start();
    console.log("⏰ Auto-stop scheduler started");

    app.listen(PORT ?? 3000);
    console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
    
  } catch (e) {
    console.error("❌ Failed to start server:", e);
  }
};

start();