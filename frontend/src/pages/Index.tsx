import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Folder, ArrowUp, PenLine, Rocket, Bug, Github, LogOut } from "lucide-react";
import { useGitHubAuth } from "@/hooks/useGitHubAuth";
import { useGitHubRepos } from "@/hooks/useGitHubRepos";
import { useGitHubPRs } from "@/hooks/useGitHubPRs";
import { RecentPR } from "@/components/RecentPR";
import { Card } from "@/components/ui/card";

const Index = () => {
  const [inputValue, setInputValue] = useState("");
  const [selectedRepo, setSelectedRepo] = useState("");
  const [lastUsedRepo, setLastUsedRepo] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, loading: authLoading, signInWithGitHub, signOut } = useGitHubAuth();
  const { repos, loading: reposLoading } = useGitHubRepos(user?.id);
  const { prs, loading: prsLoading, error: prsError } = useGitHubPRs(selectedRepo);

  // Load last used repo on component mount
  useEffect(() => {
    if (user?.id) {
      const savedRepo = localStorage.getItem(`lastUsedRepo_${user.id}`);
      if (savedRepo) {
        setLastUsedRepo(savedRepo);
      }
    }
  }, [user?.id]);

  // Save selected repo when it changes
  useEffect(() => {
    if (selectedRepo && user?.id) {
      localStorage.setItem(`lastUsedRepo_${user.id}`, selectedRepo);
    }
  }, [selectedRepo, user?.id]);

  const exampleActions = [
    { icon: PenLine, text: "Review PR changes", prompt: "Review the changes in this pull request and provide feedback" },
    { icon: Rocket, text: "Test PR functionality", prompt: "Test the functionality introduced in this pull request" },
    { icon: Bug, text: "Find PR issues", prompt: "Find potential issues or bugs in this pull request" },
  ];

  const handleSendPrompt = () => {
    if (!user) return;
    if (!inputValue.trim()) return;
    
    // Navigate to results page with prompt and repo data
    navigate("/results", {
      state: {
        prompt: inputValue,
        selectedRepo: selectedRepo
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendPrompt();
    }
    // Shift+Enter allows default behavior (new line)
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* GitHub Connection Banner */}
        {!user && (
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Github className="w-5 h-5" />
                  Connect your GitHub account to Replication
                </h2>
                <p className="text-sm text-muted-foreground">
                  Connect your GitHub account to start testing and debugging your repositories with AI
                </p>
              </div>
              <Button onClick={signInWithGitHub} className="gap-2">
                <Github className="w-4 h-4" />
                Connect GitHub
              </Button>
            </div>
          </Card>
        )}

        {/* User Info */}
        {user && (
          <div className="flex items-center justify-end gap-3">
            <div className="flex items-center gap-2">
              {user.user_metadata?.avatar_url && (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-sm text-muted-foreground">
                {user.user_metadata?.user_name || user.email}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-bold text-center mb-4">
          <span className="inline-block overflow-hidden whitespace-nowrap border-r-4 border-foreground animate-typing text-foreground">
            Replication
          </span>
          <span className="block text-2xl md:text-3xl font-normal text-muted-foreground mt-2">
            BrowserStack but better
          </span>
        </h1>
        
        {/* Main Input Card */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-xl">
          <Textarea
            placeholder={user ? "Ask Replicate to test, debug, explore" : "Connect GitHub to start..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!user}
            className="min-h-[120px] bg-transparent border-none resize-none text-lg placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 p-0 disabled:cursor-not-allowed disabled:opacity-50"
          />

          <div className="mt-6 flex items-center justify-end">
            {/* Send Button */}
            <Button
              variant="ghost"
              size="icon"
              disabled={!user || !inputValue.trim()}
              onClick={handleSendPrompt}
              className={`rounded-full transition-colors ${
                user && inputValue.trim() 
                  ? 'bg-white hover:bg-gray-100 text-black' 
                  : 'bg-secondary hover:bg-accent disabled:opacity-50'
              }`}
            >
              <ArrowUp className={`w-5 h-5 ${
                user && inputValue.trim() ? 'text-black' : 'text-muted-foreground'
              }`} />
            </Button>
          </div>
        </div>

        {/* Repository Selector and Recent PR */}
        {user && (
          <div className="flex flex-col lg:flex-row gap-4 px-2">
            <div className="flex-1">
              {/* Last Used Repo Indicator */}
              {lastUsedRepo && !selectedRepo && (
                <div className="mb-2 p-2 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-muted-foreground">
                      You checked out <span className="font-medium text-foreground">{lastUsedRepo}</span> previously
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRepo(lastUsedRepo)}
                      className="text-xs h-6 px-2"
                    >
                      Use again
                    </Button>
                  </div>
                </div>
              )}
              
              <Select value={selectedRepo} onValueChange={setSelectedRepo} disabled={!user || reposLoading}>
                <SelectTrigger className="w-full bg-card border-border">
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder={reposLoading ? "Loading repositories..." : "Select repository"} />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-popover border-border max-h-[300px]">
                  {repos.length === 0 && !reposLoading && (
                    <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                      No repositories found
                    </div>
                  )}
                  {repos.map((repo) => (
                    <SelectItem key={repo.id} value={repo.full_name}>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span>{repo.name}</span>
                          {lastUsedRepo === repo.full_name && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              Used previously
                            </span>
                          )}
                        </div>
                        {repo.description && (
                          <span className="text-xs text-muted-foreground truncate max-w-[250px]">
                            {repo.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Recent PR Component */}
            {selectedRepo && (
              <div className="w-full lg:w-80">
                <RecentPR prs={prs} loading={prsLoading} error={prsError} />
              </div>
            )}
          </div>
        )}

        {/* Example Actions */}
        <div className="space-y-4">
          <p className="text-center text-muted-foreground text-sm">
            Try these examples to get started
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {exampleActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="bg-card hover:bg-accent border-border rounded-full px-6 py-6 text-foreground"
                  onClick={() => {
                    setInputValue(action.prompt);
                  }}
                  disabled={!user}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {action.text}
                </Button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Index;
