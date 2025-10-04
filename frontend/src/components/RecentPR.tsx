import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, GitPullRequest, Calendar, User } from "lucide-react";
import { GitHubPR } from "@/hooks/useGitHubPRs";
import { formatDistanceToNow } from "date-fns";

interface RecentPRProps {
  prs: GitHubPR[];
  loading: boolean;
  error: string | null;
}

export const RecentPR = ({ prs, loading, error }: RecentPRProps) => {
  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <GitPullRequest className="w-4 h-4" />
            Most Recent PR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading pull requests...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <GitPullRequest className="w-4 h-4" />
            Most Recent PR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Error loading pull requests</div>
        </CardContent>
      </Card>
    );
  }

  if (prs.length === 0) {
    return (
      <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
          <GitPullRequest className="w-4 h-4" />
          Most Recent PR
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-yellow-600">No pull requests found</div>
      </CardContent>
      </Card>
    );
  }

  const recentPR = prs[0]; // Most recent PR

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2">
          <GitPullRequest className="w-4 h-4" />
          Most Recent PR
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-foreground truncate">
              #{recentPR.number} {recentPR.title}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant={recentPR.state === 'open' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {recentPR.state}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {recentPR.head.ref} → {recentPR.base.ref}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 flex-shrink-0"
            onClick={() => window.open(recentPR.html_url, '_blank')}
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>{recentPR.user.login}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDistanceToNow(new Date(recentPR.updated_at), { addSuffix: true })}</span>
          </div>
        </div>
        
        {recentPR.body && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {recentPR.body}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
