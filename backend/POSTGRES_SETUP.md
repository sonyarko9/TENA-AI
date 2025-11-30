# 💾 PostgreSQL Setup & Debugging for Tena AI

This document outlines the steps taken to implement, debug, and successfully deploy the PostgreSQL database persistence layer for the Tena AI application on the Render platform.

---

## 1. 🏗️ Initial Code Implementation

This phase established the application's structure for persistence using Flask-SQLAlchemy and Flask-Migrate.

* **Database Models:** Defined core models to handle conversation history:
    * `ChatSession`: Stores the session context, linked by the unique **`session_uuid`** (used by the frontend) and its primary key, **`chat_id`**.
    * `Message`: Stores the content and sender, linked to a `ChatSession` via the `chat_id` foreign key.
* **Alembic/Flask-Migrate:** Integrated Flask-Migrate to manage safe, tracked database schema changes (`flask db upgrade`) instead of relying on manual SQL.
* **Core Persistence Logic (`routes.py`):** Implemented the reliable transaction flow for history:
    1.  If a new session is detected, a new `ChatSession` record is created and **immediately committed** to the database to ensure a valid Primary Key (`chat_id`) exists.
    2.  The existing conversation history is queried and sent to the FastAPI worker.
    3.  The new user message and the received AI reply are added and committed to the database in a final transaction, ensuring the history is available for the next request.

---

## 2. 🐛 Debugging Persistent History (ID Mismatch)

The initial deployment failed to remember the conversation context.

* **Symptom:** The AI always responded as if it was the first message.
* **Root Cause:** The frontend (`ChatPage.jsx`) was sending a temporary **integer ID** (`currentChatId`) instead of the required **UUID string** (`session_uuid`) expected by the backend's persistence logic. The backend, therefore, created a *new* session for every request.
* **Solution:**
    1.  Introduced a new state variable (`currentSessionUUID`) in the frontend to store the UUID returned by the backend after the first message.
    2.  Updated the API call (`api.chat`) to pass this UUID back on every subsequent message.

---

## 3. ☁️ Production Deployment and Infrastructure Fixes

The primary deployment failure shifted from a code issue to an infrastructure and configuration issue on the Render platform.

### A. Connection Refusal (The `localhost` Problem)

* **Error:** `psycopg2.OperationalError: connection to server at "localhost" (::1), port 5432 failed: Connection refused`
* **Reason:** The Flask application's configuration was using a development default connection string (`localhost:5432`) during the Render build phase. Since the production database is a **separate service** with its own unique hostname, the build container could not find a database server on its own local machine.
* **Solution:**
    1.  **Provisioned a dedicated PostgreSQL service** on Render.
    2.  Set the Flask service's (`tena-api`) **`DATABASE_URL` environment variable** to the full, correct connection string provided by the Render PostgreSQL service (which contains a hostname like `external-db-host.render.com`, not `localhost`).

### B. Migration Execution Failure

* **Fix:** Modified the `buildCommand` in `render.yaml` to ensure migrations run successfully during deployment:
    * The `flask db upgrade` command was added to the build script to create and update the production schema.

### C. Final Best Practice Cleanup

* **Action:** Removed the unsafe `db.create_all()` call from the application factory (`create_app` in `__init__.py`).
* **Reasoning:** In production, schema changes should **only** be handled by Alembic/Flask-Migrate (`flask db upgrade`) to ensure data safety. `db.create_all()` is only safe for local development or testing.

---

**Result:** The `tena-api` service now successfully connects to the PostgreSQL database, runs migrations, and utilizes the database for persistent, multi-turn conversations.