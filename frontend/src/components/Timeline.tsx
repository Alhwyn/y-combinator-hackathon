import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle, Play } from "lucide-react";

interface TimelineStep {
  id: string;
  title: string;
  status: 'completed' | 'running' | 'pending' | 'error';
  duration?: string;
  description?: string;
}

const timelineSteps: TimelineStep[] = [
  {
    id: '1',
    title: 'Initializing Test Environment',
    status: 'completed',
    duration: '0:12',
    description: 'Setting up test containers and dependencies'
  },
  {
    id: '2',
    title: 'Running Unit Tests',
    status: 'completed',
    duration: '0:28',
    description: 'Executing 47 unit tests across 12 modules'
  },
  {
    id: '3',
    title: 'Integration Testing',
    status: 'running',
    duration: '0:45',
    description: 'Testing API endpoints and database connections'
  },
  {
    id: '4',
    title: 'Performance Analysis',
    status: 'pending',
    description: 'Measuring response times and memory usage'
  },
  {
    id: '5',
    title: 'Security Scan',
    status: 'pending',
    description: 'Checking for vulnerabilities and best practices'
  },
  {
    id: '6',
    title: 'Generating Report',
    status: 'pending',
    description: 'Compiling results and recommendations'
  }
];

export const Timeline = () => {
  const getStatusIcon = (status: TimelineStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'running':
        return <Play className="w-4 h-4 text-blue-500" />;
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
        return <Badge variant="default" className="bg-blue-500">Running</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-foreground">Test Timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {timelineSteps.map((step, index) => (
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

