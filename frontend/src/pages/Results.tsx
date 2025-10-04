import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Timeline } from "@/components/Timeline";
import { Chat } from "@/components/Chat";

const Results = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the prompt from location state (if passed)
  const prompt = location.state?.prompt || "Your prompt will appear here";
  const selectedRepo = location.state?.selectedRepo || "No repository selected";

  const handleRetry = () => {
    // In a real implementation, this would restart the testing process
    console.log("Retrying tests...");
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
            <div className="relative flex items-center">
              <p className="text-sm font-medium text-foreground/80 relative overflow-hidden">
                <span className="relative z-10">ReplicateBot is sifting through your PR</span>
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-shimmer"></span>
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Video Player */}
          <div className="lg:col-span-2 space-y-6">
            <VideoPlayer />
            <Timeline />
          </div>

          {/* Right Column - Chat */}
          <div className="lg:col-span-1">
            <Chat initialPrompt={prompt} onRetry={handleRetry} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
