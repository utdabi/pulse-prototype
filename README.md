# Pulse - Voice of Customer Analyzer

**Pulse** is a serverless feedback intelligence engine built on the Cloudflare Developer Platform. It ingests customer feedback (text + screenshots), automatically scores it for **Sentiment** and **Urgency** using Llama 3, and organizes it into a prioritized dashboard.



## ⚡ Tech Stack
* **Runtime:** Cloudflare Workers (Hono Framework)
* **Intelligence:** Workers AI (Llama 3.1 8B Instruct)
* **Database:** Cloudflare D1 (SQLite)
* **Storage:** Cloudflare R2 (Object Storage for screenshots)
