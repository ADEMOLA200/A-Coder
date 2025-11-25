# Mobile API Implementation

## Overview

The Mobile API is a REST/WebSocket API that exposes A-Coder's coding agent and workspace features, enabling mobile companion apps to interact with A-Coder remotely. The API provides secure, token-based access to chat threads, workspace files, planning features, and real-time updates.

## Architecture

### Components

The Mobile API consists of several key components:

1. **API Server** (`apiServer.ts`) - HTTP/WebSocket server running in the main process
2. **API Router** (`apiRouter.ts`) - Request routing and pattern matching
3. **API Routes** (`apiRoutes.ts`) - REST endpoint implementations
4. **API Channel** (`apiChannel.ts`) - IPC bridge between main and renderer processes
5. **API Service Manager** (`apiServiceManager.ts`) - Lifecycle management
6. **API Service Bridge** (`apiServiceBridge.ts`) - Service integration in renderer process
7. **API Auth Service** (`apiAuthService.ts`) - Token generation and validation

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile App / Client                      │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP/WebSocket
                        │ (localhost:3737)
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    Main Process (Electron)                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              API Service Manager                       │ │
│  │  - Lifecycle management                                │ │
│  │  - Settings integration                                │ │
│  └────────────┬───────────────────────────────────────────┘ │
│               │                                              │
│  ┌────────────▼───────────────────────────────────────────┐ │
│  │              API Server                                │ │
│  │  - HTTP server (port 3737)                             │ │
│  │  - WebSocket server                                    │ │
│  │  - Authentication                                      │ │
│  │  - CORS handling                                       │ │
│  └────────────┬───────────────────────────────────────────┘ │
│               │                                              │
│  ┌────────────▼───────────────────────────────────────────┐ │
│  │              API Router                                │ │
│  │  - Route registration                                  │ │
│  │  - Pattern matching                                    │ │
│  │  - JSON parsing                                        │ │
│  └────────────┬───────────────────────────────────────────┘ │
│               │                                              │
│  ┌────────────▼───────────────────────────────────────────┐ │
│  │              API Routes                                │ │
│  │  - Endpoint handlers                                   │ │
│  │  - Request validation                                  │ │
│  └────────────┬───────────────────────────────────────────┘ │
│               │                                              │
│  ┌────────────▼───────────────────────────────────────────┐ │
│  │              API Channel (IPC)                         │ │
│  │  - Main → Renderer communication                       │ │
│  └────────────┬───────────────────────────────────────────┘ │
└───────────────┼──────────────────────────────────────────────┘
                │ IPC
┌───────────────▼──────────────────────────────────────────────┐
│                  Renderer Process (Browser)                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              API Service Bridge                        │ │
│  │  - IPC handler                                         │ │
│  │  - Service integration                                 │ │
│  └────────────┬───────────────────────────────────────────┘ │
│               │                                              │
│  ┌────────────▼───────────────────────────────────────────┐ │
│  │         A-Coder Services                               │ │
│  │  - ChatThreadService                                   │ │
│  │  - ToolsService                                        │ │
│  │  - VoidSettingsService                                 │ │
│  │  - FileService                                         │ │
│  │  - WorkspaceContextService                             │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

## Security

### Authentication

The API uses token-based authentication:

- **Token Format**: `acoder_<random-string>`
- **Token Storage**: Stored in global settings (`apiTokens` array)
- **Token Validation**: Performed by `ApiAuthService`
- **Token Transmission**:
  - HTTP: `Authorization: Bearer <token>` header
  - WebSocket: `?token=<token>` query parameter

### Security Features

1. **Disabled by Default**: API must be explicitly enabled in settings
2. **Localhost Only**: Server binds to `127.0.0.1` (no direct internet exposure)
3. **Token-Based Auth**: All endpoints require valid API token
4. **CORS Support**: Configurable CORS headers for web clients
5. **Cloudflare Tunnel**: Optional secure remote access via user-configured tunnels

### Security Best Practices

- Generate unique tokens for each client/device
- Revoke tokens when no longer needed
- Use Cloudflare Tunnel for remote access (never expose port directly)
- Monitor API usage in logs
- Keep tokens secure (treat like passwords)

## API Endpoints

### Health Check

#### GET `/api/v1/health`

Health check endpoint (no authentication required).

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2025-11-25T11:30:00.000Z"
}
```

---

### Chat/Threads

#### GET `/api/v1/threads`

List all chat threads.

**Response:**
```json
{
  "threads": [
    {
      "id": "thread-123",
      "createdAt": "2025-11-25T10:00:00.000Z",
      "lastModified": "2025-11-25T11:00:00.000Z",
      "messageCount": 5
    }
  ]
}
```

#### GET `/api/v1/threads/:id`

Get specific thread with messages.

**Response:**
```json
{
  "thread": {
    "id": "thread-123",
    "createdAt": "2025-11-25T10:00:00.000Z",
    "lastModified": "2025-11-25T11:00:00.000Z",
    "messages": [
      {
        "role": "user",
        "content": "Hello",
        "timestamp": "2025-11-25T10:00:00.000Z"
      },
      {
        "role": "assistant",
        "content": "Hi! How can I help?",
        "timestamp": "2025-11-25T10:00:05.000Z"
      }
    ]
  }
}
```

#### POST `/api/v1/threads`

Create a new thread.

**Request Body:**
```json
{
  "name": "My Thread" // optional
}
```

**Response:**
```json
{
  "thread": {
    "id": "thread-456",
    "createdAt": "2025-11-25T11:30:00.000Z"
  }
}
```

#### POST `/api/v1/threads/:id/messages`

Send a message to a thread.

**Request Body:**
```json
{
  "message": "Write a hello world function"
}
```

**Response:**
```json
{
  "result": {
    "success": true,
    "threadId": "thread-123"
  }
}
```

#### DELETE `/api/v1/threads/:id`

Delete a thread.

**Response:**
```json
{
  "success": true
}
```

#### GET `/api/v1/threads/:id/status`

Get agent execution status for a thread.

**Response:**
```json
{
  "status": {
    "threadId": "thread-123",
    "isRunning": true,
    "lastActivity": "2025-11-25T11:30:00.000Z"
  }
}
```

#### POST `/api/v1/threads/:id/cancel`

Cancel running agent for a thread.

**Response:**
```json
{
  "success": true
}
```

---

### Workspace

#### GET `/api/v1/workspace`

Get workspace information.

**Response:**
```json
{
  "workspace": {
    "folders": [
      {
        "uri": "file:///Users/user/project",
        "name": "project"
      }
    ]
  }
}
```

#### GET `/api/v1/workspace/files`

List workspace files (paginated).

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 50)
- `filter` (optional)

**Response:**
```json
{
  "files": {
    "files": [],
    "page": 1,
    "limit": 50,
    "total": 0
  }
}
```

#### GET `/api/v1/workspace/files/tree`

Get workspace directory tree.

**Response:**
```json
{
  "tree": {
    "roots": [
      {
        "uri": "file:///Users/user/project",
        "name": "project"
      }
    ]
  }
}
```

#### GET `/api/v1/workspace/files/:path`

Read file contents.

**Response:**
```json
{
  "content": {
    "path": "file:///Users/user/project/src/index.ts",
    "content": "console.log('Hello');",
    "size": 21
  }
}
```

#### GET `/api/v1/workspace/files/:path/outline`

Get file outline/structure.

**Response:**
```json
{
  "outline": {
    "path": "file:///Users/user/project/src/index.ts",
    "outline": []
  }
}
```

#### POST `/api/v1/workspace/search`

Search workspace files.

**Request Body:**
```json
{
  "query": "function",
  "type": "content" // or "filename"
}
```

**Response:**
```json
{
  "results": {
    "query": "function",
    "type": "content",
    "results": []
  }
}
```

#### GET `/api/v1/workspace/diagnostics`

Get workspace diagnostics (errors, warnings).

**Response:**
```json
{
  "diagnostics": {
    "diagnostics": []
  }
}
```

---

### Planning

#### GET `/api/v1/planning/current`

Get current plan.

**Response:**
```json
{
  "plan": {
    // Plan data from PlanningService
  }
}
```

#### POST `/api/v1/planning/create`

Create a new plan.

**Request Body:**
```json
{
  "goal": "Implement user authentication",
  "tasks": [
    {
      "description": "Create login form",
      "dependencies": []
    }
  ]
}
```

**Response:**
```json
{
  "plan": {
    // Created plan data
  }
}
```

#### PATCH `/api/v1/planning/tasks/:id`

Update task status.

**Request Body:**
```json
{
  "status": "completed",
  "notes": "Task finished successfully"
}
```

**Response:**
```json
{
  "task": {
    // Updated task data
  }
}
```

---

### Settings

#### GET `/api/v1/settings`

Get A-Coder settings (read-only).

**Response:**
```json
{
  "settings": {
    "globalSettings": {
      // Global settings
    },
    "modelSelectionOfFeature": {
      // Model selections
    }
  }
}
```

#### GET `/api/v1/settings/models`

Get available models (read-only).

**Response:**
```json
{
  "models": {
    "models": [
      // Available models
    ]
  }
}
```

---

## WebSocket API

### Connection

Connect to WebSocket server with authentication:

```javascript
const ws = new WebSocket('ws://localhost:3737?token=acoder_YOUR_TOKEN');
```

### Events

Subscribe to events:

```javascript
ws.onopen = () => {
  // Subscribe to channels
  ws.send(JSON.stringify({
    type: 'subscribe',
    channels: ['threads', 'workspace', 'planning']
  }));
};
```

### Event Format

Events are broadcast in the following format:

```json
{
  "type": "event",
  "channel": "threads",
  "event": "message_added",
  "data": {
    // Event-specific data
  }
}
```

### Available Channels

- `threads` - Chat thread updates
- `workspace` - File system changes
- `planning` - Plan and task updates

---

## Configuration

### Settings

Mobile API settings are stored in global settings:

```typescript
{
  apiEnabled: boolean;        // Default: false
  apiPort: number;            // Default: 3737
  apiTokens: string[];        // Array of valid tokens
  apiTunnelUrl?: string;      // Optional Cloudflare Tunnel URL
}
```

### Settings UI

Access via: **Settings → Mobile API**

Features:
- Enable/disable toggle
- Port configuration
- Token generation and management
- Cloudflare Tunnel URL input
- Connection information display
- Status indicator

---

## Cloudflare Tunnel Setup

For secure remote access, use Cloudflare Tunnel:

### 1. Install Cloudflare Tunnel

```bash
brew install cloudflared
```

### 2. Login

```bash
cloudflared tunnel login
```

### 3. Create Tunnel

```bash
cloudflared tunnel create acoder-api
```

### 4. Configure Tunnel

Create `~/.cloudflared/config.yml`:

```yaml
tunnel: acoder-api
credentials-file: /Users/YOU/.cloudflared/TUNNEL_ID.json

ingress:
  - hostname: acoder-api.yourdomain.com
    service: http://localhost:3737
  - service: http_status:404
```

### 5. Run Tunnel

```bash
cloudflared tunnel run acoder-api
```

### 6. Configure in A-Coder

1. Go to Settings → Mobile API
2. Enter tunnel URL: `https://acoder-api.yourdomain.com`
3. Use this URL for remote connections

---

## Usage Examples

### cURL Examples

#### Health Check
```bash
curl http://localhost:3737/api/v1/health
```

#### List Threads
```bash
curl -H "Authorization: Bearer acoder_YOUR_TOKEN" \
  http://localhost:3737/api/v1/threads
```

#### Create Thread
```bash
curl -X POST \
  -H "Authorization: Bearer acoder_YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Thread"}' \
  http://localhost:3737/api/v1/threads
```

#### Send Message
```bash
curl -X POST \
  -H "Authorization: Bearer acoder_YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Write a hello world function"}' \
  http://localhost:3737/api/v1/threads/THREAD_ID/messages
```

### JavaScript/TypeScript Example

```typescript
// API Client
class ACoderAPI {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  private async request(method: string, path: string, body?: any) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getThreads() {
    return this.request('GET', '/api/v1/threads');
  }

  async createThread(name?: string) {
    return this.request('POST', '/api/v1/threads', { name });
  }

  async sendMessage(threadId: string, message: string) {
    return this.request('POST', `/api/v1/threads/${threadId}/messages`, { message });
  }

  connectWebSocket() {
    const ws = new WebSocket(`${this.baseUrl.replace('http', 'ws')}?token=${this.token}`);

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'subscribe',
        channels: ['threads', 'workspace']
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Event:', data);
    };

    return ws;
  }
}

// Usage
const api = new ACoderAPI('http://localhost:3737', 'acoder_YOUR_TOKEN');

// Create thread and send message
const { thread } = await api.createThread('My Project');
await api.sendMessage(thread.id, 'Create a React component');

// Connect to WebSocket
const ws = api.connectWebSocket();
```

---

## Implementation Details

### File Structure

```
src/vs/workbench/contrib/void/
├── common/
│   ├── apiAuthService.ts          # Token management
│   └── voidSettingsTypes.ts       # Settings types (modified)
├── browser/
│   ├── apiServiceBridge.ts        # Service integration
│   └── void.contribution.ts       # Service registration (modified)
└── electron-main/
    ├── apiServer.ts               # HTTP/WebSocket server
    ├── apiChannel.ts              # IPC bridge
    ├── apiServiceManager.ts       # Lifecycle management
    ├── mainProcessApiIntegration.ts # Main process integration
    ├── ws.d.ts                    # WebSocket type declarations
    └── api/
        ├── apiRouter.ts           # Request routing
        └── apiRoutes.ts           # Route handlers
```

### Service Integration

The API integrates with existing A-Coder services:

- **IChatThreadService**: Thread and message management
- **IToolsService**: Planning service access
- **IVoidSettingsService**: Settings access
- **IFileService**: File operations
- **IWorkspaceContextService**: Workspace information

### IPC Communication

1. HTTP request arrives at API server (main process)
2. Route handler calls `callRenderer(method, params)`
3. Request forwarded via `ApiChannel` (IPC)
4. `ApiServiceBridge` receives request (renderer process)
5. Bridge calls appropriate service method
6. Result returned via IPC
7. Response sent to HTTP client

---

## Future Enhancements

### Planned Features

- [ ] Rate limiting (100 req/min per token)
- [ ] Request size limits
- [ ] Token expiration
- [ ] Audit logging
- [ ] WebSocket subscription filtering
- [ ] File upload/download endpoints
- [ ] Batch operations
- [ ] GraphQL API option

### Mobile App Ideas

- iOS/Android companion app
- Watch app for notifications
- iPad app with split-view coding
- Voice control integration
- Remote debugging tools

---

## Troubleshooting

### API Not Starting

1. Check if API is enabled in settings
2. Verify port 3737 is not in use
3. Check console logs for errors
4. Restart A-Coder

### Authentication Failures

1. Verify token is correct
2. Check `Authorization` header format
3. Ensure token hasn't been revoked
4. Generate new token if needed

### Connection Issues

1. Verify A-Coder is running
2. Check firewall settings
3. Ensure localhost access is allowed
4. Test with `curl http://localhost:3737/api/v1/health`

### Cloudflare Tunnel Issues

1. Verify tunnel is running
2. Check tunnel configuration
3. Ensure DNS is configured
4. Test tunnel URL directly

---

## Support

For issues, questions, or feature requests:

- GitHub Issues: [A-Coder Repository](https://github.com/yourusername/a-coder)
- Documentation: This file
- Walkthrough: See `walkthrough.md` in artifacts directory

---

## License

Mobile API implementation is part of A-Coder and follows the same license as the main project.
