# ARC Mentor Server Configuration

This directory contains all backend assets for integrating the client‑only ARC Mentor app with automation platforms such as n8n and Make.com. Follow the instructions in the root README to wire the front‑end to these endpoints and prompts.

## Prompts

The files in `prompts/` are JSON configurations used to instruct the language model components of ARC Mentor:

- **planner.json** – Defines the behaviour of the Planner AI. It takes calendar events, goals, and emails and produces quest stubs with difficulty, importance, rewards and deadlines. The persona is a strict but empathetic coach. See the file for examples.
- **generator.json** – Takes quest stubs from the planner and generates fully specified quests with SMART descriptions, proof types, XP and gold rewards. Rewards scale with difficulty.
- **judge.json** – Evaluates quest completion proofs and determines pass/partial/fail outcomes. It assigns scores, awards proportional rewards, and generates penalty tasks when necessary.
- **coach.json** – Powers the chat interface. ARC Mentor speaks in a stoic, slightly sarcastic tone and can issue actions such as creating goals or quests, updating plans, or asking clarifying questions.

## SQL Schema and Seed

The `sql/` directory holds database scripts:

- **schema.sql** – Creates the necessary tables (`users`, `quests`, `penalties`, `history`) along with indexes. Designed to run on SQLite by default but compatible with PostgreSQL.
- **seed.sql** – Inserts a demo user and a couple of starter quests. Use this for local testing.

If you supply a `DB_URL` pointing to Postgres, adjust the schema accordingly and create credentials in n8n. Otherwise, n8n’s SQLite node can point to a file on disk.

## n8n Workflows

Files under `n8n/` are JSON exports of simple webhook workflows. Import them into your n8n instance or recreate them manually:

- **arc-calendar-sync.json** – Provides a `/calendar-sync` webhook (POST). It accepts `{userId, dateFrom, dateTo}` and returns a JSON with empty `missions` and `stats` by default. Extend this workflow by adding Google Calendar nodes and SQL queries as needed.
- **arc-create-events.json** – Provides a `/create-events` webhook (POST). It accepts `{userId, quests:[…]}` and returns `{created:[]}`. Extend it by adding a Google Calendar node to create events and return links.
- **arc-update.json** – Provides a `/update` webhook (POST). It accepts `{missionId, status}` and returns `{ok:true}`. Extend it by inserting entries into the `history` table or adjusting user stats.

Each workflow uses a Webhook node followed by a Respond to Webhook node. When you import them, update the credentials and add any additional logic required (e.g. Google OAuth, DB nodes). If your instance is not accessible from the internet, you can still execute the workflows internally via curl.

## Make.com Scenario (optional)

If you prefer Make.com for the AI planning endpoint, refer to `make/coach.txt`. It outlines a scenario that listens on `/coach`, calls the Planner and Generator prompts using your `OPENAI_API_KEY`, and returns side quests and penalties. You can implement similar logic in n8n instead by chaining an HTTP Request node and a Function node.

## Tests

The `tests/curl.md` file contains example `curl` commands for each endpoint. Replace `${N8N_BASE_URL}` and `${MAKE_BASE_URL}` with your actual webhook bases and run the commands from a terminal to verify that your workflows are responding correctly.

## Usage

1. **Set Secrets** – Provide `N8N_BASE_URL` (and optionally `MAKE_BASE_URL`, `OPENAI_API_KEY`, `DB_URL`, `GOOGLE_CLIENT_JSON`) as secrets to the agent. These are used to configure the front‑end and workflow nodes.
2. **Import Workflows** – Open your n8n instance and import the JSON files from the `n8n/` directory. Create credentials for Google Calendar/Gmail and your database if applicable.
3. **Configure Make** – If using Make.com, create a webhook scenario according to `make/coach.txt` and set `MAKE_BASE_URL` accordingly.
4. **Run Tests** – Use the commands in `tests/curl.md` to verify that the endpoints respond with valid JSON.
5. **Integrate** – Replace the placeholders in `app.js` with your actual webhook bases and deploy the front‑end. The client will then communicate with your automation back‑end.
