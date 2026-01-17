# Cloudflare Build - AI Agent Workflow

## Objective
Implement features one at a time, strictly following the PRD, while ensuring documentation stays in sync with implementation reality.

## Context Files
- `prd.md` - Technical Requirements & WBS (The Source of Truth)
- `progress.txt` - Running log of completed work

## Steps

### 0. Adaptive Planning (Crucial)
- Before starting any feature, verify the steps in `prd.md` are still viable.
- **IF** a better implementation path is found or a technical constraint forces a change:
    1. **STOP** and propose the change to the user.
    2. Upon approval, **UPDATE `prd.md`** with the new steps/logic.
    3. Only *then* proceed to code. The PRD must always match the Code.

### 1. Select Feature
- Read `progress.txt` to see what was last completed.
- Read `prd.md` to identify the next sequential feature.
- **Stop and confirm** the plan with the user.

### 2. Verify Environment
- Ensure `npm run dev` is running (or check if it needs to be restarted) before editing.

### 3. Implement
- Focus *only* on the selected feature.
- **MANDATORY:** Use MCP to check Cloudflare documentation (`cloudflare-docs`) for specific syntax (Hono, D1, R2, Workers AI) before writing code. Do not guess.
- Implement the code.

### 4. Validate (The Proof)
- **Backend Features (1-4):**
    - Generate and run a terminal command (cURL/script) to prove the logic works.
    - *Note: Expect a file named `test-image.png` in the root folder for file upload tests.*
- **Frontend Features (5-6):**
    - Ask the user to open `http://localhost:8787` in their browser.
    - Ask the user: "Does the page look correct?"
- **CRITICAL PROTOCOL:** If a test fails:
    1. **STOP.** Do not auto-fix.
    2. Report the specific error to the user immediately.

### 5. Update Documentation
- Mark the feature as `[COMPLETE]` in `progress.txt`.
- **Verify:** Did we deviate from the PRD? If yes, update `prd.md` to reflect what was actually built.

### 6. Commit
- Generate a git commit message: `feat: [feature name]`