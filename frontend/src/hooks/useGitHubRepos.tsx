import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  updated_at: string;
}

export const useGitHubRepos = (userId: string | undefined) => {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) {
      setRepos([]);
      return;
    }

    const fetchRepos = async () => {
      setLoading(true);
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
        
        console.log('Calling Edge Function with session for user:', session.user.id);
        console.log('Session provider_token exists:', !!session.provider_token);
        console.log('Session provider_token preview:', session.provider_token ? session.provider_token.substring(0, 10) + '...' : 'null');
        console.log('Full session object:', JSON.stringify(session, null, 2));
        console.log('Session user metadata:', JSON.stringify(session.user.user_metadata, null, 2));
        console.log('Session app metadata:', JSON.stringify(session.user.app_metadata, null, 2));
        
        // Check for alternative token locations
        console.log('Checking alternative token locations...');
        console.log('session.access_token:', session.access_token ? session.access_token.substring(0, 10) + '...' : 'null');
        console.log('session.refresh_token:', session.refresh_token ? session.refresh_token.substring(0, 10) + '...' : 'null');
        console.log('session.provider_refresh_token:', session.provider_refresh_token ? session.provider_refresh_token.substring(0, 10) + '...' : 'null');
        
        // Try to find GitHub token in different locations
        let githubToken = session.provider_token;
        
        // Check if token is in user metadata
        if (!githubToken && session.user.user_metadata?.provider_token) {
          githubToken = session.user.user_metadata.provider_token;
          console.log('Found GitHub token in user metadata');
        }
        
        // Check if token is in app metadata
        if (!githubToken && session.user.app_metadata?.provider_token) {
          githubToken = session.user.app_metadata.provider_token;
          console.log('Found GitHub token in app metadata');
        }
        
        console.log('Final GitHub token found:', !!githubToken);
        
        if (!githubToken) {
          console.error('No GitHub token found anywhere in session');
          throw new Error('No GitHub access token available. Please check Supabase GitHub OAuth configuration.');
        }
        
        // Test direct GitHub API call first
        try {
          console.log('Testing direct GitHub API call...');
          const githubResponse = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
            headers: {
              'Authorization': `token ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'Replication-App'
            }
          });
          
          console.log('GitHub API response status:', githubResponse.status);
          console.log('GitHub API response ok:', githubResponse.ok);
          
          if (!githubResponse.ok) {
            const errorText = await githubResponse.text();
            console.error('GitHub API error:', errorText);
            throw new Error(`GitHub API error: ${githubResponse.statusText}`);
          }
          
          const repos = await githubResponse.json();
          console.log(`Direct GitHub API call successful, found ${repos.length} repositories`);
          setRepos(repos);
          return; // Skip Edge Function call if direct call works
        } catch (directError) {
          console.error('Direct GitHub API call failed:', directError);
          console.log('Falling back to Edge Function...');
        }
        
        const { data, error } = await supabase.functions.invoke('fetch-github-repos');
        
        if (error) throw error;

        if (data?.repos) {
          setRepos(data.repos);
        }
      } catch (error: any) {
        console.error('Error fetching GitHub repos:', error);
        toast({
          title: "Error fetching repositories",
          description: error.message || "Failed to load your GitHub repositories",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, [userId, toast]);

  return { repos, loading };
};
