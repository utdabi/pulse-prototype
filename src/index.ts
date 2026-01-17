import { Hono } from "hono";

// Bindings interface for Cloudflare resources
interface Bindings {
  DB: D1Database; // Feature 2: D1 SQL Database
  IMAGES: R2Bucket; // Feature 2: R2 Object Storage
  AI: Ai; // Feature 3: Workers AI
}

const app = new Hono<{ Bindings: Bindings }>();

// Feature 5: Customer Pulse Dashboard - Landing Page
app.get("/", async (c) => {
  try {
    // Query all feedback records, sorted by urgency (DESC) then timestamp (DESC)
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM feedback ORDER BY urgency DESC, timestamp DESC"
    ).all();

    const feedbackRecords = results as Array<{
      id: number;
      source: string;
      content: string;
      sentiment: string;
      urgency: number;
      image_key: string | null;
      timestamp: string;
    }>;

    // Calculate stats
    const totalCount = feedbackRecords.length;
    const criticalCount = feedbackRecords.filter((f) => f.urgency === 5).length;
    const highCount = feedbackRecords.filter((f) => f.urgency === 4).length;
    const mediumCount = feedbackRecords.filter((f) => f.urgency === 3).length;

    // Generate HTML dashboard
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pulse - Customer Feedback Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    header {
      background: white;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    h1 {
      color: #2d3748;
      margin-bottom: 15px;
      font-size: 32px;
    }
    .stats {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
      margin-top: 20px;
    }
    .stat {
      background: #f7fafc;
      padding: 15px 25px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    .stat-label { font-size: 12px; color: #718096; text-transform: uppercase; margin-bottom: 5px; }
    .stat-value { font-size: 24px; font-weight: bold; color: #2d3748; }
    
    /* Table-like layout */
    .feedback-table {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .feedback-row {
      display: grid;
      grid-template-columns: 100px 1fr 200px;
      border-bottom: 1px solid #e2e8f0;
      transition: background 0.2s;
      align-items: start;
    }
    .feedback-row:last-child {
      border-bottom: none;
    }
    .feedback-row:hover {
      background: #f7fafc;
    }
    
    .sentiment-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      text-align: center;
      border-right: 2px solid #e2e8f0;
      min-height: 100%;
    }
    .sentiment-emoji {
      font-size: 36px;
      margin-bottom: 8px;
    }
    .urgency-number {
      font-size: 18px;
      font-weight: bold;
      color: #2d3748;
    }
    .urgency-5 .sentiment-col { background: #fff5f5; border-right-color: #fc8181; }
    .urgency-4 .sentiment-col { background: #fffaf0; border-right-color: #f6ad55; }
    .urgency-3 .sentiment-col { background: #fefcbf; border-right-color: #f6e05e; }
    .urgency-2 .sentiment-col { background: #ebf8ff; border-right-color: #63b3ed; }
    .urgency-1 .sentiment-col { background: #f0fff4; border-right-color: #68d391; }
    
    .content-col {
      padding: 20px;
      border-right: 1px solid #e2e8f0;
    }
    .feedback-text {
      color: #2d3748;
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 10px;
    }
    .screenshot-thumb {
      max-width: 150px;
      max-height: 100px;
      border-radius: 6px;
      cursor: pointer;
      transition: opacity 0.2s;
      border: 2px solid #e2e8f0;
    }
    .screenshot-thumb:hover {
      opacity: 0.8;
      border-color: #667eea;
    }
    
    .meta-col {
      padding: 20px;
      font-size: 13px;
      color: #718096;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .no-feedback {
      background: white;
      border-radius: 12px;
      padding: 60px;
      text-align: center;
      color: #718096;
    }
    .submit-link {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 30px;
      border-radius: 8px;
      text-decoration: none;
      margin-top: 20px;
      font-weight: 600;
      transition: background 0.2s;
    }
    .submit-link:hover { background: #5a67d8; }
    
    @media (max-width: 768px) {
      .feedback-row {
        grid-template-columns: 1fr;
      }
      .sentiment-col {
        border-right: none;
        border-bottom: 2px solid #e2e8f0;
      }
      .content-col {
        border-right: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🔔 Pulse - Customer Feedback Dashboard</h1>
      <p>Prioritized by AI-analyzed urgency</p>
      <div class="stats">
        <div class="stat">
          <div class="stat-label">Total Feedback</div>
          <div class="stat-value">${totalCount}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Critical (5)</div>
          <div class="stat-value" style="color: #e53e3e;">${criticalCount}</div>
        </div>
        <div class="stat">
          <div class="stat-label">High (4)</div>
          <div class="stat-value" style="color: #dd6b20;">${highCount}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Medium (3)</div>
          <div class="stat-value" style="color: #d69e2e;">${mediumCount}</div>
        </div>
      </div>
    </header>

    ${
      feedbackRecords.length === 0
        ? `
    <div class="no-feedback">
      <h2>No feedback yet</h2>
      <p>Start by submitting feedback through the API or submission form.</p>
      <a href="/submit" class="submit-link">Submit Feedback</a>
    </div>
    `
        : `
    <div class="feedback-table">
      ${feedbackRecords
        .map(
          (record) => `
        <div class="feedback-row urgency-${record.urgency}">
          <div class="sentiment-col">
            <div class="sentiment-emoji">
              ${
                record.sentiment === "positive"
                  ? "😊"
                  : record.sentiment === "negative"
                    ? "😞"
                    : "😐"
              }
            </div>
            <div class="urgency-number">${record.urgency}</div>
          </div>
          <div class="content-col">
            <div class="feedback-text">${record.content}</div>
            ${
              record.image_key
                ? `<img src="/api/image/${encodeURIComponent(record.image_key)}" alt="Screenshot" class="screenshot-thumb" onclick="window.open(this.src, '_blank')" title="Click to view full size">`
                : ""
            }
          </div>
          <div class="meta-col">
            <div class="meta-item">📍 ${record.source}</div>
            <div class="meta-item">🕒 ${new Date(record.timestamp).toLocaleString()}</div>
            <div class="meta-item" style="text-transform: capitalize;">💭 ${record.sentiment}</div>
          </div>
        </div>
      `
        )
        .join("")}
    </div>
    `
    }
  </div>
</body>
</html>
`;

    return c.html(html);
  } catch (error) {
    return c.text("Failed to load dashboard: " + (error instanceof Error ? error.message : String(error)), 500);
  }
});

// Feature 5: R2 Image Proxy - Secure image retrieval
app.get("/api/image/:key", async (c) => {
  try {
    const key = c.req.param("key");
    
    // Security: Only allow images from feedback/ prefix
    if (!key.startsWith("feedback/")) {
      return c.text("Invalid image key", 403);
    }

    const object = await c.env.IMAGES.get(key);
    if (!object) {
      return c.text("Image not found", 404);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("Cache-Control", "public, max-age=31536000");

    return new Response(object.body, { headers });
  } catch (error) {
    return c.text("Failed to retrieve image: " + (error instanceof Error ? error.message : String(error)), 500);
  }
});

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
