# ARC Mentor

ARC Mentor is a gamified life tracker that helps you manage your tasks and missions using your calendar. The application consists of a client‑side web interface and a set of server workflows (e.g. n8n) that expose webhooks to sync your calendar, create events, update mission status and chat with an AI coach. Missions are rewarded with XP and gold, and penalties are applied automatically for missed tasks.

## Client UI

The web UI is a single‑page application built with HTML, CSS and vanilla JavaScript. It features a tab bar with five views:

* **Dashboard** – shows your current HP, XP, XP goal, gold and streak.
* **Missions** – lists your missions with buttons to mark them as done or fail.
* **Calendar** – contains buttons to synchronise your missions with your calendar and to create events from your missions.
* **Coach** – a chat interface where you can ask the AI coach for guidance. The coach may respond with additional side quests or penalties.
* **Settings** – lets you set your user identifier. The webhook base URL is configured via secrets and never displayed.

The client communicates with backend webhooks defined in the `server/n8n` directory. In mock mode (when the webhook placeholders are not replaced), the application returns deterministic dummy data so you can explore the UI without configuring the backend.

## Server

The `server` directory contains workflow definitions and prompts for the AI.

### Prompts

Under `server/prompts` you will find four JSON files used as system prompts for OpenAI when planning missions, generating tasks and penalties, judging mission results and chatting as the coach. These are based on the conversation with the user and should be passed as the system messages to ChatGPT or similar models.

### SQL

The `server/sql` folder includes a schema for a simple missions/penalties database (`schema.sql`) and a seed file (`seed.sql`) with an initial mission. SQLite is the default; you can provide a `DB_URL` to use Postgres instead. See `server/README.md` for details.

### n8n Workflows

The `server/n8n` folder contains exported workflows for n8n:

* **arc‑calendar‑sync.json** – webhook `/calendar-sync` that returns missions and stats.
* **arc‑create‑events.json** – webhook `/create-events` that returns created calendar event links.
* **arc‑update.json** – webhook `/update` that acknowledges mission status updates.

Import these into your n8n instance and activate them. If you wish to handle the coach in n8n instead of Make.com, create a fourth workflow with a webhook `/coach` and an OpenAI node configured with the prompt from `server/prompts/coach.json`.

### Make.com

If you use Make.com instead of n8n for the coach endpoint, the `server/make/coach.txt` file contains guidance on how to implement it.

### Tests

Use the commands in `server/tests/curl.md` to test your webhooks. Replace `${N8N_BASE_URL}` with your actual base URL before running the commands.

## Usage

1. Serve the `index.html` file (e.g. via GitHub Pages) so that the web UI is accessible.
2. Configure your secrets (e.g. `N8N_BASE_URL`, `MAKE_BASE_URL`, `OPENAI_API_KEY`) in your deployment environment. The placeholders in `app.js` will be replaced during deployment.
3. Import and activate the n8n workflows under `server/n8n` or implement the corresponding endpoints in your own backend. Optionally implement a coach endpoint using the prompts provided.
4. Open the app in a browser, set your user ID in the **Settings** tab, and start managing your missions.
