import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password').notNull(),
});

export const refreshTokens = sqliteTable(
  'refresh_tokens',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    createdAt: integer('created_at').notNull(),
    expiresAt: integer('expires_at').notNull(),
    revokedAt: integer('revoked_at'),
  },
  (table) => ({
    userIdIdx: index('refresh_tokens_user_id_idx').on(table.userId),
  })
);

export const engines = sqliteTable("engines", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  dockerImage: text("docker_image").notNull(),
  healthEndpoint: text("health_endpoint").notNull(),
  status: text("status").default("available"),
  createdAt: integer("created_at", { mode: "timestamp" }),
});

export const models = sqliteTable("models", {
  id: text("id").primaryKey(),
  engine: text("engine").notNull(),
  name: text("name").notNull(),
  displayName: text("display_name").notNull(),
  category: text("category").notNull(),
  series: text("series"),
  performanceTier: text("performance_tier"),
  sizeMb: integer("size_mb"),
  iconUrl: text("icon_url"),
  description: text("description"),
  // Resource requirements (in MB for memory, in cores for CPU)
  minMemoryMb: integer("min_memory_mb").default(512),
  recMemoryMb: integer("rec_memory_mb").default(2048),
  minCpuCores: integer("min_cpu_cores").default(1),
  recCpuCores: integer("rec_cpu_cores").default(2),
  createdAt: integer("created_at", { mode: "timestamp" }),
});

export const instances = sqliteTable("instances", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id), 
  engineId: text("engine_id").notNull().references(() => engines.id), 
  modelId: text("model_id").notNull().references(() => models.id),
  containerName: text("container_name").notNull(),
  port: integer("port").notNull(),
  status: text("status").notNull(),
  // Resource allocation
  allocatedMemoryMb: integer("allocated_memory_mb"),
  allocatedCpuCores: integer("allocated_cpu_cores"),
  autoStopMinutes: integer("auto_stop_minutes"), // null = no auto-stop
  createdAt: integer("created_at", { mode: "timestamp" }),
  lastActivity: integer("last_activity", { mode: "timestamp" }),
});