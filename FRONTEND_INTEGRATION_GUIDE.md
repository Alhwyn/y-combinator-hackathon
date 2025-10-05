# Frontend Integration Guide

## Overview

The frontend has been successfully integrated with the video WebSocket stream and Anthropic API agent system. This document explains how everything works together.

## Architecture

### Components

1. **VideoPlayer** (`frontend/src/components/VideoPlayer.tsx`)

   - Connects to WebSocket at `wss://replication.ngrok.io` (or `ws://localhost:3001` locally)
   - Receives real-time video frames from the agent's browser
   - Displays live test execution in browser or mobile view
   - Handles agent connection/disconnection events
   - Auto-reconnects on connection loss

2. **Timeline** (`frontend/src/components/Timeline.tsx`)

   - Displays real-time test execution progress
   - Shows 5 stages: Initialize, Analyze, Test, Gather Results, Report
   - Updates dynamically based on agent status
   - Visual indicators for pending, running, completed, and error states

3. **Chat** (`frontend/src/components/Chat.tsx`)

   - Bidirectional communication with the AI agent
   - Sends user instructions to the Anthropic API via backend
   - Receives and displays agent responses
   - Maintains conversation history
   - Loading states and error handling

4. **Results Page** (`frontend/src/pages/Results.tsx`)
   - Orchestrates all components
   - Starts the AI agent on mount
   - Polls agent status and updates timeline
   - Coordinates WebSocket events with UI updates

## Configuration

### Backend URL (config.js)

The frontend automatically detects the environment:

```javascript
// For local development
const API_BASE_URL = "http://localhost:3001";
const WS_BASE_URL = "ws://localhost:3001";

// For ngrok/production
const API_BASE_URL = "https://replication.ngrok.io";
const WS_BASE_URL = "wss://replication.ngrok.io";
```

**Current Production URL**: `https://replication.ngrok.io`

### API Endpoints

The following endpoints are configured:

- **Start Agent**: `POST /api/ai-agent/start`
- **Stop Agent**: `POST /api/ai-agent/stop`
- **Agent Status**: `GET /api/ai-agent/status?agentId=<id>`
- **Next Action**: `POST /api/ai-agent/next-action`
- **WebSocket Viewer**: `wss://replication.ngrok.io/viewer`
- **WebSocket Agent**: `wss://replication.ngrok.io/agent`

## WebSocket Protocol

### Message Types

#### From Server to Client (Viewer)

1. **agent_list** - Initial list of connected agents

```json
{
  "type": "agent_list",
  "agents": [
    {
      "agentId": "agent-123",
      "agentName": "Test Agent 1"
    }
  ]
}
```

2. **agent_connected** - New agent connected

```json
{
  "type": "agent_connected",
  "agentId": "agent-123",
  "agentName": "Test Agent 1"
}
```

3. **agent_disconnected** - Agent disconnected

```json
{
  "type": "agent_disconnected",
  "agentId": "agent-123",
  "agentName": "Test Agent 1"
}
```

4. **frame** - Video frame from agent

```json
{
  "type": "frame",
  "agentId": "agent-123",
  "frame": "data:image/png;base64,..."
}
```

5. **test_started** - Test execution started

```json
{
  "type": "test_started",
  "agentId": "agent-123",
  "testId": "test-456"
}
```

6. **test_completed** - Test execution completed

```json
{
  "type": "test_completed",
  "agentId": "agent-123",
  "testId": "test-456",
  "results": { ... }
}
```

## Data Flow

### Starting a Test

1. User enters prompt and selects repository on Index page
2. User clicks "Send" → navigates to Results page with prompt & repo data
3. Results page component mounts and calls `startAgent()`
4. Backend starts AI agent with Anthropic API
5. Timeline updates: "Initializing Agent" → Completed
6. Agent connects to WebSocket and starts streaming video
7. VideoPlayer receives frames and displays live view
8. Timeline progresses through stages as agent works
9. Chat component receives agent's thought process and updates

### Real-Time Updates

```
Agent Browser → WebSocket Server → Frontend VideoPlayer
              ↓
          Timeline Updates
              ↓
          Chat Messages
```

### User Interaction Flow

```
User types in Chat → API Call → Anthropic API → Agent receives instruction
                                        ↓
                                  Agent adjusts behavior
                                        ↓
                                  Updates sent to frontend
```

## Implementation Details

### VideoPlayer WebSocket Connection

```typescript
// Connects automatically on mount
useEffect(() => {
  const ws = new WebSocket(config.ws.viewer);

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);

    switch (message.type) {
      case "frame":
        setCurrentFrame(message.frame);
        break;
      // ... handle other message types
    }
  };

  // Auto-reconnect on disconnect
  ws.onclose = () => {
    setTimeout(connectWebSocket, 3000);
  };
}, []);
```

### Timeline State Management

```typescript
// Timeline steps are managed in Results page
const [timelineSteps, setTimelineSteps] = useState([...]);

// Updated based on agent status
const updateTimelineStep = (stepId, updates) => {
  setTimelineSteps(prevSteps =>
    prevSteps.map(step =>
      step.id === stepId ? { ...step, ...updates } : step
    )
  );
};
```

### Chat API Integration

```typescript
// Send message to agent
const response = await fetch(`${config.api.aiAgent.nextAction}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    agentId,
    testId,
    userInstruction: message,
    currentState: { messages },
  }),
});
```

## Testing the Integration

### 1. Start Backend (with ngrok)

```bash
# Backend should be running at https://replication.ngrok.io
# Verify it's accessible:
curl https://replication.ngrok.io/health
```

### 2. Start Frontend

```bash
cd frontend
npm run dev
```

### 3. Test Flow

1. Open frontend in browser
2. Connect GitHub account
3. Select a repository
4. Enter a prompt (e.g., "Test the login functionality")
5. Click Send → Navigate to Results page
6. Verify:
   - Timeline shows "Initializing Agent" → "Running"
   - WebSocket connects (check browser console for "✅ WebSocket connected")
   - Video stream appears (or "Waiting for stream..." if agent hasn't started yet)
   - Chat shows initial messages
7. Send a chat message
8. Verify agent responds

## Debugging

### WebSocket Issues

Check browser console for:

- `🔌 Connecting to video stream: wss://replication.ngrok.io/viewer`
- `✅ WebSocket connected`
- `🤖 Agent connected: <agent-name>`

If connection fails:

1. Verify backend is running at ngrok URL
2. Check CORS settings in backend
3. Verify ngrok tunnel is active

### API Call Issues

Check browser Network tab for:

- POST to `/api/ai-agent/start` → Should return `{ agentId, testId }`
- GET to `/api/ai-agent/status` → Should return `{ status: '...' }`
- POST to `/api/ai-agent/next-action` → Should return `{ response: '...' }`

### Video Not Showing

1. Check agent is properly sending frames via WebSocket
2. Verify frame format is `data:image/png;base64,...`
3. Check canvas rendering in VideoPlayer component

## Environment Variables

### Backend (Already configured)

```env
ANTHROPIC_API_KEY=your_key_here
SUPABASE_URL=your_url_here
SUPABASE_SERVICE_KEY=your_key_here
PORT=3001
```

### Frontend (No env vars needed)

Configuration is automatic based on hostname in `config.js`.

## Production Deployment

When deploying to production:

1. Update `config.js` to use your production backend URL:

```javascript
const API_BASE_URL = "https://your-production-url.com";
const WS_BASE_URL = "wss://your-production-url.com";
```

2. Build frontend:

```bash
cd frontend
npm run build
```

3. Deploy the `dist/` folder to your hosting service

## Key Features

✅ **Real-time Video Streaming** - Live browser view of agent's actions
✅ **WebSocket Auto-Reconnect** - Handles connection drops gracefully
✅ **Timeline Progress** - Visual feedback on test stages
✅ **Interactive Chat** - Send instructions to agent mid-test
✅ **Error Handling** - Graceful degradation on failures
✅ **Mobile/Browser Toggle** - Switch between view modes
✅ **Status Polling** - Regular updates from agent
✅ **Toast Notifications** - User-friendly feedback

## Next Steps

To enhance the integration:

1. **Add screenshot history** - Store and display past frames
2. **Add test results visualization** - Charts and graphs
3. **Add download reports** - Export test results as PDF
4. **Add agent selection** - Choose which agent's stream to watch
5. **Add collaborative features** - Multiple users watching same test
6. **Add recording** - Save test runs for replay

## Troubleshooting

### "Connection Error" in VideoPlayer

- Backend is not running or unreachable
- Check ngrok tunnel is active
- Verify CORS configuration

### Agent not starting

- Check Anthropic API key is valid
- Verify Supabase credentials
- Check backend logs for errors

### Timeline not updating

- Agent status polling might be failing
- Check `/api/ai-agent/status` endpoint
- Verify agent is sending status updates

### Chat messages not working

- `/api/ai-agent/next-action` endpoint issue
- Check Anthropic API rate limits
- Verify agent is receiving instructions

## Support

For issues or questions:

1. Check browser console for errors
2. Check backend logs
3. Verify all environment variables are set
4. Test individual components in isolation

---

**Last Updated**: October 4, 2025
**Backend URL**: https://replication.ngrok.io
**Status**: ✅ Fully Integrated
