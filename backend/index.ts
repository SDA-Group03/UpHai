import { app } from './src/app.js';
import { PORT } from './src/config/env.js';

app.listen(PORT);
console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

export { app };
import { Elysia, t } from 'elysia';
import { initDB, db } from "./db/index.js";
import { cors } from '@elysiajs/cors'

initDB();

const app = new Elysia().use(cors())
  .get('/', () => `Hello, Elysia!`)

  .get('/api/users', () => {
    const users = db.query("SELECT * FROM users").all();
    return users;
  })

  .post('/api/users', ({ body, set }) => {
    try {
      const insertQuery = db.query("INSERT INTO users (username, password) VALUES ($username, $password)");
      
      insertQuery.run({
        $username: body.username,
        $password: body.password
      });

      return { 
        success: true, 
        message: "User created successfully!",
        username: body.username 
      };

    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        set.status = 409; 
        return { success: false, message: "Username already exists" };
      }
      set.status = 500;
      return { success: false, message: "Internal Server Error" };
    }
  }, {
    body: t.Object({
      username: t.String(),
      password: t.String()
    })
  })

  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
