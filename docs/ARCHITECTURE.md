Tena AI Backend Architecture Documentation

This document outlines the architecture, data models, authentication flow, and administrative features of the Tena AI Flask backend.

1. Core Stack

Component

Technology/Library

Purpose

Server

Flask

Primary web framework and API handler.

Database

PostgreSQL (Production), SQLite (Development)

Persistent data storage.

ORM

Flask-SQLAlchemy

Python object relational mapper.

Migrations

Flask-Migrate (Alembic)

Database schema management and version control.

Authentication

Flask-Login

Session management and user state handling.

Security

Flask-Bcrypt

Password hashing.

2. Data Model (Schema Overview)

The application uses three primary tables, connected by Foreign Key constraints.

User Table (user)
Stores user credentials and metadata.

Column Name

Type

Constraints

Description

user_id

Integer

Primary Key, Auto-increment

Unique identifier for the user.

email

String

Unique, Not Null

User login email.

password_hash

String

Not Null

Hashed password using Bcrypt.

user_name

String

Not Null

Display name for the user.

is_admin

Boolean

Default: False

Flag for administrative access rights.

reset_token

String

Nullable

Token used for password reset requests.

reset_token_expiration

DateTime

Nullable

Timestamp for token expiry.

Chat Session Table (chat_session)
Stores metadata about a conversation session.

Column Name

Type

Constraints

Description

session_id

Integer

Primary Key, Auto-increment

Unique identifier for the chat session.

user_id

Integer

Foreign Key (User)

The owner of the session.

title

String



User-provided or generated session title.

created_at

DateTime

Not Null

Timestamp of session creation.

Message Table (message)
Stores the history of messages within a session.

Column Name

Type

Constraints

Description

message_id

Integer

Primary Key, Auto-increment

Unique identifier for the message.

session_id

Integer

Foreign Key (ChatSession)

The session this message belongs to.

role

String

Not Null

Sender role (user or ai).

content

Text

Not Null

The text content of the message.

timestamp

DateTime

Not Null

Time the message was recorded.

3. Authentication and Security Flow

3.1 Key Security Features

Password Hashing: Passwords are never stored in plain text. Flask-Bcrypt is used to generate strong, one-way hashes (password_hash).

Session Management: Flask-Login handles cookie-based sessions, securing routes with @login_required.

3.2 Password Reset Feature

The password reset feature is implemented via the following flow:

Request Reset: User submits their email to a /api/auth/reset-password-request endpoint.

Token Generation: A unique, time-limited reset_token (e.g., 1 hour expiration) is generated and stored in the user table alongside the reset_token_expiration timestamp.

Email Sending: The unique reset link containing the token is sent to the user's email address.

Reset Validation: The /api/auth/reset-password/<token> endpoint validates the token against the database, ensuring it exists and has not expired, before allowing the user to set a new password.

4. Chat and History Management

The chat system is designed for persistent, multi-turn conversations:

New Conversation: When a user sends a message without a current session_id, a new ChatSession record is created.

Message Persistence: Every single exchange (both user input and AI response) is stored as a new row in the message table, linked to the session_id.

Context Management: When the user sends a subsequent message, the entire history of message records for that session_id is fetched and sent to the Gemini API as context, enabling memory and multi-turn conversation.

Retrieval of History: The /api/chats route retrieves all ChatSession records for the logged-in user, and the /api/chats/<id> route fetches all associated Message records.

5. Administrative Features

Access to administrative endpoints is restricted using the custom @admin_required decorator, which checks if current_user.is_admin is True.

5.1 Admin Endpoints

Endpoint

Method

Restriction

Description

/api/admin/metrics/system

GET

@admin_required

Returns counts of total users, chat sessions, and messages.

/api/admin/users

GET

@admin_required

Lists all users (non-sensitive data).

/api/admin/delete-all-users

POST

@admin_required

CRITICAL: Wipes all data from the user, chat_session, and message tables and resets the auto-increment sequences.

5.2 Database Wipe Logic (PostgreSQL Safety)

The delete-all-users function uses raw SQL TRUNCATE for efficiency and sequence reset. To ensure compatibility with PostgreSQL reserved keywords and modern SQLAlchemy versions, the following implementation details were used:

The reserved table name user is quoted: tables = ['"user"', 'chat_session', 'message'].

Raw SQL is wrapped using sqlalchemy.text(): db.session.execute(text(...)).

6. Health Check Implementation (Deployment Requirement)

To ensure service monitoring works correctly in deployment, a public, non-authenticated health check is provided:

Endpoint: /api/health

Access: Public (No authentication required).

Functionality: Confirms the Flask server is running and handles CORS preflight (OPTIONS requests) correctly to avoid connectivity errors on the client side.

This guarantees that monitoring tools and the frontend landing page can quickly and reliably check the Flask server's responsiveness without being blocked by security policies.