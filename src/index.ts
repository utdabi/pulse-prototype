import { Hono } from "hono";

// Bindings interface will be expanded in future features
// Feature 2 will add: DB (D1) and IMAGES (R2)
// Feature 3 will add: AI (Workers AI)
interface Bindings {}

const app = new Hono<{ Bindings: Bindings }>();

// Health check endpoint
app.get("/status", (c) => {
  return c.json({
    status: "ok",
    message: "Pulse application is running",
    timestamp: new Date().toISOString(),
  });
});

export default app;
