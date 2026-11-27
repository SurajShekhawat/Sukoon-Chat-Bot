# API.md: API Contracts & Streaming Protocols

## 1. Conventions & Authentication

- **Base URL:** `/api`
- **Authentication:** All protected endpoints require a Supabase Auth session token (passed via secure HTTP-only cookies in browsers or `Authorization: Bearer <jwt>` for external/mobile clients).
- **Format:** Standard JSON (`Content-Type: application/json`) for REST endpoints; `text/event-stream` for chat streaming.
- **Validation:** Every request payload is validated server-side via Zod. Invalid requests return HTTP 422 with structured field error descriptions.

---

## 2. API Endpoints

### 2.1 Chat Streaming Endpoint (`POST /api/chat`)
Streams AI responses back to the client using Server-Sent Events (SSE).

#### Request Headers
```http
POST /api/chat HTTP/1.1
Content-Type: application/json
Authorization: Bearer <supabase_jwt>
```

#### Request Payload
```json
{
  "conversationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "message": "Kal interview hai aur mujhe bahut darr lag raha hai...",
  "language": "hinglish"
}
```

#### Zod Validation Schema
```typescript
export const ChatRequestSchema = z.object({
  conversationId: z.string().uuid(),
  message: z.string().min(1).max(4000),
  language: z.enum(["hi", "hinglish", "en"]).default("hinglish"),
});
```

#### Response Stream Events (`text/event-stream`)
- **`event: start`**
  ```json
  { "conversationId": "3fa85f64-...", "userMessageId": "8fa85f64-..." }
  ```
- **`event: token`**
  ```json
  { "delta": "Main" }
  ```
- **`event: safety_alert`** (Fired if safety check identifies acute crisis)
  ```json
  {
    "level": "crisis",
    "helpline": {
      "name": "Tele-MANAS (Govt. of India)",
      "number": "14416",
      "available": "24/7 Toll-Free"
    }
  }
  ```
- **`event: memory_candidate`** (Fired if AI detects an explicit memory candidate)
  ```json
  {
    "candidateText": "Has an upcoming job interview tomorrow",
    "category": "career"
  }
  ```
- **`event: done`**
  ```json
  {
    "assistantMessageId": "9fa85f64-...",
    "tokensUsed": 185
  }
  ```

---

### 2.2 Conversations API

#### `GET /api/conversations`
Retrieves a paginated list of conversations for the authenticated user.
- **Query Params:** `limit` (default 20), `offset` (default 0), `includeArchived` (boolean)
- **Response (200 OK):**
```json
{
  "conversations": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "title": "Interview Anxiety",
      "language": "hinglish",
      "isArchived": false,
      "createdAt": "2026-10-29T10:00:00Z",
      "updatedAt": "2026-10-29T10:05:00Z",
      "lastMessage": "Main samajh sakta hoon ki..."
    }
  ],
  "total": 1
}
```

#### `POST /api/conversations`
Creates a new conversation container.
- **Request Payload:**
```json
{
  "title": "Career transition discussion",
  "language": "hinglish"
}
```
- **Response (201 Created):** Full conversation object.

#### `GET /api/conversations/:id`
Retrieves full conversation details and its complete message history in ascending order.
- **Response (200 OK):**
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "title": "Interview Anxiety",
  "language": "hinglish",
  "messages": [
    {
      "id": "8fa85f64-...",
      "role": "user",
      "content": "Kal interview hai...",
      "createdAt": "2026-10-29T10:00:00Z"
    },
    {
      "id": "9fa85f64-...",
      "role": "assistant",
      "content": "Interview se pehle thoda anxious hona bilkul normal hai...",
      "createdAt": "2026-10-29T10:00:02Z"
    }
  ]
}
```

#### `PATCH /api/conversations/:id`
Updates title or archives conversation.
- **Request:** `{ "title": "New Title", "isArchived": true }`
- **Response (200 OK):** Updated conversation.

#### `DELETE /api/conversations/:id`
Permanently deletes conversation and cascades deletion to all associated messages.
- **Response (204 No Content)**

---

### 2.3 Consent-Based Memories API

#### `GET /api/memories`
List all active memories stored for the authenticated user.
- **Response (200 OK):**
```json
{
  "memories": [
    {
      "id": "4fa85f64-...",
      "content": "Lives with elder sister in Bangalore",
      "category": "personal",
      "isActive": true,
      "createdAt": "2026-10-25T14:30:00Z"
    }
  ]
}
```

#### `POST /api/memories`
Creates a verified memory with explicit user consent.
- **Request:** `{ "content": "Preparing for UPSC exams", "category": "career" }`
- **Response (201 Created):** Created memory record.

#### `PATCH /api/memories/:id`
Updates content or toggles active status (`isActive: false` pauses memory from being used in AI context).

#### `DELETE /api/memories/:id`
Permanently deletes memory.
- **Response (204 No Content)**

---

### 2.4 Mood Journal & Goals API

#### `POST /api/mood`
- **Request:**
```json
{
  "score": 4,
  "primaryEmotion": "relieved",
  "notes": "Finished my team presentation today."
}
```
- **Response (201 Created)**

#### `GET /api/mood`
- **Query:** `days=30`
- **Response (200 OK):** List of mood entries sorted by `recorded_at desc`.

#### `POST /api/goals`
- **Request:**
```json
{
  "title": "Practice 10 mins meditation",
  "description": "Daily before sleep",
  "targetDate": "2026-11-30"
}
```

---

### 2.5 Privacy, Export & Account Deletion

#### `POST /api/user/export`
Generates a complete JSON export of user profile, conversations, messages, memories, moods, and goals.

#### `DELETE /api/user/account`
Initiates complete deletion of all user data and permanently destroys the user authentication record in Supabase Auth.

---

### 2.6 Admin AI Model Settings & Multi-Provider Health

#### `GET /api/admin/ai-settings`
Retrieves configured AI providers (Google Gemini, OpenAI, NVIDIA NIM), health status, latency stats, registered model catalog, and active task routing policies.
- **Security:** Requires authenticated administrator session. Never exposes full API secrets (returns masked credentials e.g. `nvap...****`).
- **Response (200 OK):**
```json
{
  "activeProvider": "gemini",
  "activeModel": "gemini-3.5-flash-lite",
  "providers": {
    "gemini": { "name": "Google Gemini", "isConfigured": true, "status": "healthy", "lastLatencyMs": 312 },
    "nvidia": { "name": "NVIDIA NIM", "isConfigured": true, "status": "healthy", "lastLatencyMs": 420, "isDevOnly": true },
    "openai": { "name": "OpenAI", "isConfigured": false, "status": "unconfigured" }
  },
  "models": [...],
  "routingPolicies": [...]
}
```

#### `POST /api/admin/ai-settings`
Updates routing policy for a specific task category with pre-execution capability validation.
- **Request Payload:**
```json
{
  "task": "COMPLEX_REASONING",
  "preferredProvider": "nvidia",
  "preferredModel": "nvidia/nemotron-3.5-super-vl-120b-a12b",
  "allowNVIDIA": true,
  "allowOpenAI": true
}
```
- **Response (200 OK or 422 Unprocessable Entity if model lacks task capabilities)**

#### `POST /api/admin/ai-settings/test`
Triggers an isolated, non-destructive probe to test connectivity to an AI provider.
- **Request Payload:**
```json
{
  "provider": "nvidia"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "result": {
    "provider": "nvidia",
    "status": "healthy",
    "latencyMs": 384,
    "message": "NVIDIA NIM API catalog is responsive. Test model: minimaxai/minimax-m3.1-flash"
  }
}
```

---

## 3. Standard Error Response Format

All error responses return standard RFC 7807 JSON:
```json
{
  "error": {
    "code": "UNAUTHORIZED | FORBIDDEN | NOT_FOUND | RATE_LIMITED | VALIDATION_ERROR | INTERNAL_ERROR",
    "message": "Human-readable explanation of error",
    "details": []
  }
}
```
