# AI Event Lead Manager — Backend REST API

Production-grade asynchronous REST API built with FastAPI, SQLAlchemy 2.0, asyncpg, and Alembic, connected to a serverless Neon PostgreSQL database.

## Architecture

```
backend/
├── app/
│   ├── api/
│   │   └── routes/
│   │       ├── health.py         # /health and /api/v1/health endpoints
│   │       └── leads.py          # /api/v1/leads CRUD, search, filter, pagination
│   ├── core/
│   │   ├── config.py             # Pydantic Settings & async URL normalizer
│   │   └── database.py           # Async engine, sessionmaker, get_db dependency
│   ├── models/
│   │   └── lead.py               # SQLAlchemy 2.0 Lead ORM model & Enum
│   ├── schemas/
│   │   └── lead.py               # Pydantic v2 validation schemas
│   ├── repositories/
│   │   └── lead.py               # Async DB query isolation & filters
│   ├── services/
│   │   └── lead.py               # Business rules, validation, pagination logic
│   └── main.py                   # FastAPI application, CORS, error handling
├── migrations/                   # Alembic database migrations
├── tests/                        # Pytest async test suite
└── requirements.txt              # Production dependencies
```

## REST API Endpoints

### 1. Health Checks
- `GET /health` or `GET /api/v1/health`
  - Response (200):
    ```json
    {
      "status": "ok",
      "service": "AI Event Lead Manager",
      "environment": "development"
    }
    ```

### 2. Create Lead
- `POST /api/v1/leads`
  - Status Code: `201 Created`
  - Request Body:
    ```json
    {
      "name": "Alex Johnson",
      "company": "Vanguard Tech",
      "email": "alex@vanguard.io",
      "event": "Cloud Expo 2026",
      "notes": "Discussed enterprise license for 50 seats.",
      "follow_up_status": "Not Contacted"
    }
    ```
  - Response (201):
    ```json
    {
      "id": "c1f72a42-9bc1-4475-b6d4-d897e937d25e",
      "name": "Alex Johnson",
      "company": "Vanguard Tech",
      "email": "alex@vanguard.io",
      "event": "Cloud Expo 2026",
      "notes": "Discussed enterprise license for 50 seats.",
      "follow_up_status": "Not Contacted",
      "created_at": "2026-10-06T18:30:00Z",
      "updated_at": "2026-10-06T18:30:00Z"
    }
    ```

### 3. List Leads (Search, Filter, Pagination)
- `GET /api/v1/leads`
  - Query Parameters:
    - `search` (optional string): Case-insensitive match across `name`, `company`, `email`, or `event`.
    - `follow_up_status` (optional string): Pipeline stage (`Not Contacted`, `Follow Up`, `Contacted`, `Qualified`, `Converted`, `Not Interested`).
    - `page` (optional integer, default `1`, min `1`): Current page.
    - `page_size` (optional integer, default `20`, min `1`, max `100`): Results per page.
  - Response (200):
    ```json
    {
      "items": [
        {
          "id": "c1f72a42-9bc1-4475-b6d4-d897e937d25e",
          "name": "Alex Johnson",
          "company": "Vanguard Tech",
          "email": "alex@vanguard.io",
          "event": "Cloud Expo 2026",
          "notes": "Discussed enterprise license for 50 seats.",
          "follow_up_status": "Not Contacted",
          "created_at": "2026-10-06T18:30:00Z",
          "updated_at": "2026-10-06T18:30:00Z"
        }
      ],
      "page": 1,
      "page_size": 20,
      "total": 1,
      "total_pages": 1
    }
    ```

### 4. Get Lead by UUID
- `GET /api/v1/leads/{lead_id}`
  - Status Code: `200 OK` (or `404 Not Found`)

### 5. Partial Update (PATCH)
- `PATCH /api/v1/leads/{lead_id}`
  - Status Code: `200 OK` (or `404 Not Found`)
  - Request Body (only supplied fields are updated):
    ```json
    {
      "follow_up_status": "Qualified",
      "notes": "Demo completed. Budget approved."
    }
    ```

### 6. Delete Lead
- `DELETE /api/v1/leads/{lead_id}`
  - Status Code: `204 No Content` (or `404 Not Found`)

### 7. Summarize Lead Interaction Notes (Google Gemini AI)
- `POST /api/v1/leads/{lead_id}/summarize`
  - Status Code: `200 OK` (or `400 Bad Request` if notes are empty, `404 Not Found` if lead doesn't exist)
  - Response (200):
    ```json
    {
      "lead_id": "c1f72a42-9bc1-4475-b6d4-d897e937d25e",
      "summary": "Client is evaluating an enterprise tier license for 50 seats following discussion at Cloud Expo 2026."
    }
    ```

### 8. Draft Personalized Follow-Up Message (Google Gemini AI)
- `POST /api/v1/leads/{lead_id}/follow-up`
  - Status Code: `200 OK` (or `404 Not Found` if lead doesn't exist)
  - Response (200):
    ```json
    {
      "lead_id": "c1f72a42-9bc1-4475-b6d4-d897e937d25e",
      "message": "Hi Alex, It was great connecting at Cloud Expo 2026 and discussing Vanguard Tech's upcoming initiatives. Per our conversation, I'd love to share more details on our 50-seat enterprise deployment. Would you have 15 minutes for a quick chat next week?"
    }
    ```

## Running Tests

Run the asynchronous test suite:
```bash
pytest backend/tests -v
```
All tests execute against an isolated in-memory test database fixture and never mutate production database state.
