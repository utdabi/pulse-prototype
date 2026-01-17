# Pulse - Voice of Customer Analyzer (Prototype)

## Product Overview
**Description:** A "Universal Feedback Receiver" that centralizes customer sentiment and visual bug reports from fragmented channels into a single, prioritized source of truth using Cloudflare's Developer Platform.

## Technical Stack
- **Edge Runtime:** Cloudflare Workers (Hono)
- **AI/ML Layer:** Workers AI (Llama 3)
- **Relational Data:** D1 SQL Database
- **Object Storage:** R2 (Screenshots/Attachments)
- **Environment:** Windows 11 / Node.js

## Features (Work Breakdown Structure)

### Feature 1: Foundation & Environment
- **User Story:** "As a developer, I need a stable, pre-configured environment so I can focus on building features without fighting configuration errors."
- **Steps:**
    1. Initialize the Worker project using the Hono framework (`npm create cloudflare@latest`).
    2. Configure the development environment for Windows 11 compatibility.
    3. Implement a health-check endpoint (`GET /status`) to verify runtime availability.
    4. Validate local development server (`npm run dev`) stability.

### Feature 2: Persistent Storage Layer (D1 & R2)
- **User Story:** "As a system architect, I need to separate structured metadata from large binary files (screenshots) to ensure the database remains fast and scalable."
- **Steps:**
    1. Provision the D1 SQL database (`pulse_db`) and R2 bucket (`pulse-images`) via Wrangler CLI.
    2. Establish environment bindings for D1 and R2 within `wrangler.toml`.
    3. Define the relational schema: `feedback` table (id, source, content, sentiment, urgency, image_key, timestamp).
    4. Apply SQL migrations to initialize the data layer.
    5. Validate database connectivity and storage bucket accessibility.

### Feature 3: Intelligence Layer (Workers AI)
- **User Story:** "As a Support Lead, I need incoming feedback to be automatically scored for 'Urgency' so my team doesn't waste time manually triaging low-priority items."
- **Steps:**
    1. Configure **Native** Workers AI access (`env.AI`) in `wrangler.toml` (Do NOT use external AI SDKs).
    2. Develop a processing function to evaluate incoming text payloads.
    3. Design a prompt to enforce structured output: `{ "sentiment": "string", "urgency": number }`.
    4. Test the AI classification logic against a set of mock feedback strings.

### Feature 4: Ingestion Pipeline (Webhook Logic)
- **User Story:** "As an integrator, I need a robust logic layer that accepts text and images, processes them, and saves them safely."
- **Steps:**
    1. Implement the core logic to handle `multipart/form-data`.
    2. Logic: If an image file is present, stream it to R2 and get the key.
    3. Logic: Send the text content to Workers AI (Feature 3).
    4. **Crucial:** Parse the AI's string response into JSON variables (`sentiment`, `urgency`).
    5. Logic: Insert the full record (Text + AI Score + Image Key) into D1.

### Feature 5: Customer Pulse Dashboard (Read View)
- **User Story:** "As a Product Manager, I need a dashboard that sorts feedback by 'Urgency' (not just date) so I can immediately identify and fix critical bugs."
- **Steps:**
    1. Develop a landing page (`GET /`) that retrieves records from the D1 database.
    2. Sort the view by `urgency` (DESC) to prioritize critical customer issues.
    3. Implement a secure file-retrieval proxy route to serve screenshots directly from R2.
    4. Render a structured dashboard displaying content, AI scores, and visual evidence.

### Feature 6: Manual Submission Interface (Write View)
- **User Story:** "As a user, I need a simple web form to report bugs and attach screenshots manually, so I can test the system without writing code."
- **Steps:**
    1. Create a `GET /submit` route that renders a simple HTML form (Text Area + File Input).
    2. Create a `POST /submit` route to handle the form submission.
    3. Reuse the ingestion logic from Feature 4.
    4. **Crucial:** Upon success, redirect the user back to the Dashboard (`/`) instead of returning raw JSON.