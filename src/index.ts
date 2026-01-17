import { Hono } from "hono";

// Bindings interface for Cloudflare resources
interface Bindings {
  DB: D1Database; // Feature 2: D1 SQL Database
  IMAGES: R2Bucket; // Feature 2: R2 Object Storage
  AI: Ai; // Feature 3: Workers AI
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

// AI Classification function
async function classifyFeedback(
  text: string,
  ai: Ai
): Promise<{ sentiment: string; urgency: number }> {
  const prompt = `You are a customer feedback analyzer. Analyze the following customer feedback and classify it.

Customer Feedback: "${text}"

Instructions:
- Determine the sentiment: "positive", "neutral", or "negative"
- Assign an urgency score from 1 to 5:
  * 1 = Low priority (compliments, minor suggestions, general praise)
  * 2 = Normal (standard feedback, feature requests)
  * 3 = Medium (usability issues, moderate bugs)
  * 4 = High (significant problems affecting user experience)
  * 5 = Critical (app crashes, data loss, security vulnerabilities, blocking issues)

Respond with ONLY a JSON object in this exact format:
{"sentiment": "positive|neutral|negative", "urgency": 1-5}`;

  const response = await ai.run("@cf/meta/llama-3.1-8b-instruct", {
    prompt: prompt,
  });

  // Parse the AI response
  const aiResponse = response as { response?: string };
  if (!aiResponse.response) {
    throw new Error("No response from AI");
  }

  // Extract JSON from the response
  const jsonMatch = aiResponse.response.match(/\{[^}]+\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse JSON from AI response");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    sentiment: parsed.sentiment,
    urgency: parseInt(parsed.urgency),
  };
}

// Test endpoint: Workers AI classification
app.get("/test/ai", async (c) => {
  try {
    const testCases = [
      {
        text: "The app crashes every time I click the submit button! I can't use it at all!",
        expected: "urgency: 5 (critical)",
      },
      {
        text: "Love the new design! Everything works smoothly and looks great.",
        expected: "urgency: 1 (low)",
      },
      {
        text: "The button alignment on the homepage is slightly off-center.",
        expected: "urgency: 2-3 (normal/medium)",
      },
      {
        text: "The page takes 10 seconds to load, making it frustrating to use.",
        expected: "urgency: 4 (high)",
      },
    ];

    const results = [];
    for (const testCase of testCases) {
      const classification = await classifyFeedback(testCase.text, c.env.AI);
      results.push({
        input: testCase.text,
        expected: testCase.expected,
        result: classification,
      });
    }

    return c.json({
      status: "ok",
      message: "Workers AI classification successful",
      testResults: results,
    });
  } catch (error) {
    return c.json(
      {
        status: "error",
        message: "Workers AI classification failed",
        error: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

// Feature 4: Ingestion Pipeline - POST endpoint
app.post("/api/feedback", async (c) => {
  try {
    // Parse multipart form data
    const formData = await c.req.formData();
    const content = formData.get("content") as string;
    const source = formData.get("source") as string;
    const imageEntry = formData.get("image");

    // Validate required fields
    if (!content || !source) {
      return c.json(
        {
          status: "error",
          message: "Missing required fields: 'content' and 'source' are required",
        },
        400
      );
    }

    // Step 1: Handle image upload to R2 (if present)
    let imageKey: string | null = null;
    if (imageEntry && typeof imageEntry !== 'string') {
      // imageEntry is a File
      const file = imageEntry as File;
      if (file.size > 0) {
        imageKey = `feedback/${Date.now()}-${file.name}`;
        await c.env.IMAGES.put(imageKey, file.stream());
      }
    }

    // Step 2: Send text content to Workers AI for classification
    const aiResult = await classifyFeedback(content, c.env.AI);

    // Step 3: Insert the complete record into D1
    const result = await c.env.DB.prepare(
      "INSERT INTO feedback (source, content, sentiment, urgency, image_key) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(source, content, aiResult.sentiment, aiResult.urgency, imageKey)
      .run();

    return c.json({
      status: "success",
      message: "Feedback ingested successfully",
      data: {
        id: result.meta.last_row_id,
        source,
        content,
        sentiment: aiResult.sentiment,
        urgency: aiResult.urgency,
        imageKey,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return c.json(
      {
        status: "error",
        message: "Failed to ingest feedback",
        error: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

export default app;
