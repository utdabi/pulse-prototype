import { Hono } from "hono";

// Bindings interface for Cloudflare resources
interface Bindings {
  DB: D1Database; // Feature 2: D1 SQL Database
  IMAGES: R2Bucket; // Feature 2: R2 Object Storage
  // Feature 3 will add: AI (Workers AI)
}

const app = new Hono<{ Bindings: Bindings }>();

// Health check endpoint
app.get("/status", (c) => {
  return c.json({
    status: "ok",
    message: "Pulse application is running",
    timestamp: new Date().toISOString(),
  });
});

// Test endpoint: D1 Database connectivity
app.get("/test/db", async (c) => {
  try {
    // Insert a test record
    await c.env.DB.prepare(
      "INSERT INTO feedback (source, content, sentiment, urgency) VALUES (?, ?, ?, ?)"
    )
      .bind("test", "Test feedback entry", "neutral", 5)
      .run();

    // Retrieve all records
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM feedback ORDER BY id DESC LIMIT 5"
    ).all();

    return c.json({
      status: "ok",
      message: "D1 Database connection successful",
      recordCount: results.length,
      sampleRecords: results,
    });
  } catch (error) {
    return c.json(
      {
        status: "error",
        message: "D1 Database connection failed",
        error: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

// Test endpoint: R2 Storage connectivity
app.get("/test/r2", async (c) => {
  try {
    const testKey = `test-${Date.now()}.txt`;
    const testContent = "Hello from Pulse! This is a test file.";

    // Upload test file to R2
    await c.env.IMAGES.put(testKey, testContent);

    // Retrieve the file
    const object = await c.env.IMAGES.get(testKey);
    if (!object) {
      throw new Error("Failed to retrieve test file from R2");
    }

    const retrievedContent = await object.text();

    return c.json({
      status: "ok",
      message: "R2 Storage connection successful",
      testKey,
      uploadedContent: testContent,
      retrievedContent,
      match: testContent === retrievedContent,
    });
  } catch (error) {
    return c.json(
      {
        status: "error",
        message: "R2 Storage connection failed",
        error: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

export default app;
