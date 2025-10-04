import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface GitHubPR {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  html_url: string;
  user: {
    login: string;
    avatar_url: string;
  };
  head: {
    ref: string;
  };
  base: {
    ref: string;
  };
}

export const useGitHubPRs = (selectedRepo: string | undefined) => {
  const [prs, setPrs] = useState<GitHubPR[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!selectedRepo) {
      setPrs([]);
      setError(null);
      return;
    }

    const fetchPRs = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Check if we have a valid session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw new Error('Authentication error');
        }
        
        if (!session) {
          console.error('No active session found');
          throw new Error('No active session');
        }

        console.log('Fetching PRs for repo:', selectedRepo);
        
        // Make direct GitHub API call to fetch only OPEN PRs
        const githubResponse = await fetch(`https://api.github.com/repos/${selectedRepo}/pulls?state=open&sort=updated&direction=desc&per_page=5`, {
          headers: {
            'Authorization': `token ${session.provider_token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Replication-App'
          }
        });
        
        console.log('GitHub PRs API response status:', githubResponse.status);
        
        if (!githubResponse.ok) {
          const errorText = await githubResponse.text();
          console.error('GitHub PRs API error:', errorText);
          throw new Error(`GitHub API error: ${githubResponse.statusText}`);
        }
        
        const prsData = await githubResponse.json();
        console.log(`Found ${prsData.length} open PRs for ${selectedRepo}`);
        setPrs(prsData);
        
      } catch (error: any) {
        console.error('Error fetching GitHub PRs:', error);
        setError(error.message);
        toast({
          title: "Error fetching pull requests",
          description: error.message || "Failed to load pull requests",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPRs();
  }, [selectedRepo, toast]);

  return { prs, loading, error };
};
