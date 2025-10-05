import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle, Play } from "lucide-react";
import { useState, useEffect } from "react";

interface TimelineStep {
  id: string;
  title: string;
  status: 'completed' | 'running' | 'pending' | 'error';
  duration?: string;
  description?: string;
  timestamp?: Date;
}

interface TimelineProps {
  steps?: TimelineStep[];
  onStepUpdate?: (step: TimelineStep) => void;
}

export const Timeline = ({ steps: propSteps, onStepUpdate }: TimelineProps) => {
  const [steps, setSteps] = useState<TimelineStep[]>(propSteps || [
    {
      id: '1',
      title: 'Initializing Agent',
      status: 'pending',
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

  useEffect(() => {
    if (propSteps) {
      setSteps(propSteps);
    }
  }, [propSteps]);

  // Helper to update step status
  const updateStep = (stepId: string, updates: Partial<TimelineStep>) => {
    setSteps(prevSteps => {
      const newSteps = prevSteps.map(step => 
        step.id === stepId 
          ? { ...step, ...updates, timestamp: new Date() }
          : step
      );
      
      // Call callback if provided
      const updatedStep = newSteps.find(s => s.id === stepId);
      if (updatedStep && onStepUpdate) {
        onStepUpdate(updatedStep);
      }
      
      return newSteps;
    });
  };

  // Expose updateStep via window for external updates
  useEffect(() => {
    (window as any).updateTimelineStep = updateStep;
    return () => {
      delete (window as any).updateTimelineStep;
    };
  }, []);

  const getStatusIcon = (status: TimelineStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'running':
        return <Play className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: TimelineStep['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'running':
        return <Badge variant="default" className="bg-blue-500 animate-pulse">Running</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const formatDuration = (start: Date, end: Date) => {
    const seconds = Math.floor((end.getTime() - start.getTime()) / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-foreground">Agent Timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getStatusIcon(step.status)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="text-sm font-medium text-foreground">{step.title}</h4>
                <div className="flex items-center gap-2">
                  {step.duration && (
                    <span className="text-xs text-muted-foreground">{step.duration}</span>
                  )}
                  {getStatusBadge(step.status)}
                </div>
              </div>
              {step.description && (
                <p className="text-xs text-muted-foreground">{step.description}</p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

