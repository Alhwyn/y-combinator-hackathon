# Multi-Agent Testing Dashboard - Frontend

This folder is reserved for the frontend dashboard application.

## Suggested Implementation

### Recommended Stack

- **React** + **Vite** + **TailwindCSS**
- **Supabase JS Client** for real-time subscriptions
- **React Query** for data fetching
- **Recharts** or **Chart.js** for visualizations

### Key Features to Implement

1. **Real-time Agent Monitoring**

   - Live agent status display
   - Agent health indicators
   - Active test assignments

2. **Test Results Viewer**

   - Test execution history
   - Pass/fail statistics
   - Screenshot viewer with before/after comparison

3. **Test Case Management**

   - Create/Edit/Delete test cases
   - Test case templates
   - Bulk operations

4. **Dashboard Analytics**
   - Test execution metrics
   - Agent utilization charts
   - Success rate trends
   - Performance graphs

### Setup Instructions

#### Option 1: React + Vite

\`\`\`bash
cd frontend
npm create vite@latest . -- --template react
npm install @supabase/supabase-js
npm install @tanstack/react-query
npm install recharts
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p
\`\`\`

#### Option 2: Next.js

\`\`\`bash
cd frontend
npx create-next-app@latest . --typescript --tailwind --app
npm install @supabase/supabase-js
\`\`\`

### Environment Variables

Create a \`.env.local\` file:

\`\`\`env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
\`\`\`

### Supabase Realtime Integration

Example of subscribing to agent updates:

\`\`\`javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
import.meta.env.VITE_SUPABASE_URL,
import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Subscribe to agent changes
const channel = supabase
.channel('agents')
.on('postgres_changes',
{ event: '\*', schema: 'public', table: 'agents' },
(payload) => {
console.log('Agent updated:', payload);
}
)
.subscribe();
\`\`\`

### Suggested Components

- \`AgentList\` - Display all agents with status
- \`TestCaseList\` - List and manage test cases
- \`TestResultsView\` - Show test execution results
- \`ScreenshotViewer\` - Display before/after screenshots
- \`MetricsDashboard\` - Charts and statistics
- \`TestCaseEditor\` - Create/edit test cases

---

**Note:** This is an empty placeholder. Implement your preferred frontend framework here.
