import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Timeline } from "@/components/Timeline";
import { Chat } from "@/components/Chat";
import { useState, useEffect } from "react";
import config from "../../config";
import { useToast } from "@/hooks/use-toast";

interface TimelineStep {
  id: string;
  title: string;
  status: 'completed' | 'running' | 'pending' | 'error';
  duration?: string;
  description?: string;
}

const Results = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get the prompt from location state (if passed)
  const prompt = location.state?.prompt || "Your prompt will appear here";
  const selectedRepo = location.state?.selectedRepo || "No repository selected";
  
  const [agentId, setAgentId] = useState<string | null>(null);
  const [testId, setTestId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [agentStatus, setAgentStatus] = useState<string>('initializing');
  const [timelineSteps, setTimelineSteps] = useState<TimelineStep[]>([
    {
      id: '1',
      title: 'Initializing Agent',
      status: 'running',
      description: 'Setting up AI agent and browser environment'
    },
    {
      id: '2',
      title: 'Analyzing Repository',
      status: 'pending',
      description: 'Understanding codebase structure and requirements'
    },
    {
      id: '3',
      title: 'Running Tests',
      status: 'pending',
      description: 'Executing autonomous testing based on prompt'
    },
    {
      id: '4',
      title: 'Gathering Results',
      status: 'pending',
      description: 'Collecting test outcomes and screenshots'
    },
    {
      id: '5',
      title: 'Generating Report',
      status: 'pending',
      description: 'Compiling findings and recommendations'
    }
  ]);

  // Start the agent on component mount
  useEffect(() => {
    startAgent();
  }, []);

  const startAgent = async () => {
    setIsStarting(true);
    
    try {
      // Extract actual URL if it's a GitHub repo, otherwise use a default
      let testUrl = 'https://www.nytimes.com/games/wordle';
      
      if (selectedRepo && selectedRepo !== 'No repository selected') {
        // If it's a GitHub repo format (owner/repo), convert to URL
        if (selectedRepo.includes('/') && !selectedRepo.startsWith('http')) {
          testUrl = `https://github.com/${selectedRepo}`;
        } else if (selectedRepo.startsWith('http')) {
          testUrl = selectedRepo;
        }
      }
      
      console.log('🚀 Starting agent with:', { prompt, testUrl, selectedRepo });
      
      // Start the AI agent by spawning a test
      const response = await fetch(`${config.api.baseUrl}/api/spawn-agents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          url: testUrl,
          agents: 1 // Single agent for this test
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to start agent');
      }

      const data = await response.json();
      
      // Set a temporary agent ID immediately for UI
      const tempAgentId = `temp-${data.testCaseId.substring(0, 8)}`;
      setAgentId(tempAgentId);
      setTestId(data.testCaseId);
      
      console.log('✅ Agent spawned:', { agentId: tempAgentId, testId: data.testCaseId });
      
      // Update timeline
      updateTimelineStep('1', { status: 'completed' });
      updateTimelineStep('2', { status: 'running' });
      
      toast({
        title: "Agent Started",
        description: "AI agent is now running your tests",
      });
      
      // Start polling for status updates with the temp ID
      pollAgentStatus(tempAgentId);
      
    } catch (error) {
      console.error('❌ Error starting agent:', error);
      updateTimelineStep('1', { 
        status: 'error',
        description: 'Failed to start agent. Please try again.' 
      });
      
      toast({
        title: "Error",
        description: "Failed to start the AI agent. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsStarting(false);
    }
  };

  const pollAgentStatus = async (id: string) => {
    if (!id) {
      console.warn('⚠️ Cannot poll status - no agent ID');
      return;
    }
    
    const poll = async () => {
      try {
        // Use test queue status instead of agent status API
        const response = await fetch(`${config.api.baseUrl}/api/agents`);
        if (response.ok) {
          const agents = await response.json();
          
          // Check if any agent is busy (running our test)
          const busyAgents = agents.filter((a: any) => a.connected);
          
          if (busyAgents.length > 0) {
            setAgentStatus('running');
            updateTimelineStep('2', { status: 'completed' });
            updateTimelineStep('3', { status: 'running' });
          }
          
          // Continue polling
          setTimeout(poll, 2000);
        }
      } catch (error) {
        console.error('Error polling agent status:', error);
        // Continue polling even on error
        setTimeout(poll, 5000);
      }
    };
    
    // Start polling after a short delay
    setTimeout(poll, 1000);
  };

  const updateTimelineStep = (stepId: string, updates: Partial<TimelineStep>) => {
    setTimelineSteps(prevSteps => 
      prevSteps.map(step => 
        step.id === stepId ? { ...step, ...updates } : step
      )
    );
  };

  const handleRetry = () => {
    // Reset and restart
    setTimelineSteps(timelineSteps.map(step => ({
      ...step,
      status: 'pending' as const
    })));
    startAgent();
  };

  const handleAgentEvent = (event: any) => {
    // Handle events from the video stream WebSocket
    if (event.type === 'test_started') {
      updateTimelineStep('3', { status: 'running' });
    } else if (event.type === 'test_completed') {
      updateTimelineStep('3', { status: 'completed' });
      updateTimelineStep('4', { status: 'running' });
    }
  };

  const handleStepUpdate = (step: TimelineStep) => {
    // Callback when timeline step is updated
    console.log('Timeline step updated:', step);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          <div className="flex-1 flex items-center gap-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Agentic Testing</h1>
              <p className="text-sm text-muted-foreground">{selectedRepo}</p>
            </div>
            <div className="relative flex items-center gap-3">
              {isStarting && <Loader2 className="w-4 h-4 animate-spin" />}
              <p className="text-sm font-medium text-foreground/80 relative overflow-hidden">
                <span className="relative z-10">
                  {isStarting 
                    ? 'Starting agent...' 
                    : agentStatus === 'completed'
                    ? 'Testing completed!'
                    : 'ReplicateBot is working on your task'}
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-shimmer"></span>
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Video Player */}
          <div className="lg:col-span-2 space-y-6">
            <VideoPlayer 
              agentId={agentId || undefined} 
              onAgentEvent={handleAgentEvent}
            />
            <Timeline 
              steps={timelineSteps}
              onStepUpdate={handleStepUpdate}
            />
          </div>

          {/* Right Column - Chat */}
          <div className="lg:col-span-1">
            <Chat 
              initialPrompt={prompt} 
              onRetry={handleRetry}
              agentId={agentId || undefined}
              testId={testId || undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
