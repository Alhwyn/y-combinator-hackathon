-- Multi-Agent Browser Testing System - Database Schema

-- Enable UUID extension (pgcrypto is preferred for newer PostgreSQL versions)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;

-- Create custom types
CREATE TYPE test_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');
CREATE TYPE agent_status AS ENUM ('idle', 'busy', 'unhealthy', 'offline');
CREATE TYPE action_type AS ENUM ('navigate', 'click', 'fill', 'select', 'wait', 'scroll', 'hover', 'press', 'assert', 'screenshot');
CREATE TYPE step_status AS ENUM ('pending', 'running', 'passed', 'failed', 'skipped');

-- Agents table
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    status agent_status DEFAULT 'idle',
    browser_type VARCHAR(50) DEFAULT 'chromium',
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_test_id UUID,
    total_tests_run INTEGER DEFAULT 0,
    successful_tests INTEGER DEFAULT 0,
    failed_tests INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test cases table
CREATE TABLE test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    url VARCHAR(1000) NOT NULL,
    actions JSONB NOT NULL,
    status test_status DEFAULT 'pending',
    priority INTEGER DEFAULT 5,
    timeout_ms INTEGER DEFAULT 60000,
    assigned_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test results table
CREATE TABLE test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    status test_status NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    error_message TEXT,
    error_stack TEXT,
    screenshots JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test steps table
CREATE TABLE test_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_result_id UUID NOT NULL REFERENCES test_results(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    action_type action_type NOT NULL,
    action_data JSONB NOT NULL,
    status step_status DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    screenshot_before VARCHAR(500),
    screenshot_after VARCHAR(500),
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_last_heartbeat ON agents(last_heartbeat);
CREATE INDEX idx_test_cases_status ON test_cases(status);
CREATE INDEX idx_test_cases_priority ON test_cases(priority DESC);
CREATE INDEX idx_test_cases_assigned_agent ON test_cases(assigned_agent_id);
CREATE INDEX idx_test_results_test_case ON test_results(test_case_id);
CREATE INDEX idx_test_results_agent ON test_results(agent_id);
CREATE INDEX idx_test_results_status ON test_results(status);
CREATE INDEX idx_test_results_created_at ON test_results(created_at DESC);
CREATE INDEX idx_test_steps_test_result ON test_steps(test_result_id);
CREATE INDEX idx_test_steps_status ON test_steps(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_cases_updated_at BEFORE UPDATE ON test_cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_steps ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role has full access to agents" ON agents
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to test_cases" ON test_cases
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to test_results" ON test_results
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to test_steps" ON test_steps
    FOR ALL USING (auth.role() = 'service_role');

-- Allow anon/authenticated read access
CREATE POLICY "Public read access to agents" ON agents
    FOR SELECT USING (true);

CREATE POLICY "Public read access to test_cases" ON test_cases
    FOR SELECT USING (true);

CREATE POLICY "Public read access to test_results" ON test_results
    FOR SELECT USING (true);

CREATE POLICY "Public read access to test_steps" ON test_steps
    FOR SELECT USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE agents;
ALTER PUBLICATION supabase_realtime ADD TABLE test_cases;
ALTER PUBLICATION supabase_realtime ADD TABLE test_results;
ALTER PUBLICATION supabase_realtime ADD TABLE test_steps;

-- Helper function to claim a test for an agent
CREATE OR REPLACE FUNCTION claim_test(agent_uuid UUID)
RETURNS UUID AS $$
DECLARE
    test_id UUID;
BEGIN
    -- Find the highest priority pending test and claim it
    SELECT id INTO test_id
    FROM test_cases
    WHERE status = 'pending'
    ORDER BY priority DESC, created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
    
    IF test_id IS NOT NULL THEN
        UPDATE test_cases
        SET status = 'running',
            assigned_agent_id = agent_uuid,
            updated_at = NOW()
        WHERE id = test_id;
        
        UPDATE agents
        SET status = 'busy',
            current_test_id = test_id,
            updated_at = NOW()
        WHERE id = agent_uuid;
    END IF;
    
    RETURN test_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to release a test (on completion or failure)
CREATE OR REPLACE FUNCTION release_test(agent_uuid UUID, test_uuid UUID, new_status test_status)
RETURNS VOID AS $$
BEGIN
    UPDATE test_cases
    SET status = new_status,
        assigned_agent_id = NULL,
        updated_at = NOW()
    WHERE id = test_uuid;
    
    UPDATE agents
    SET status = 'idle',
        current_test_id = NULL,
        total_tests_run = total_tests_run + 1,
        successful_tests = CASE WHEN new_status = 'completed' THEN successful_tests + 1 ELSE successful_tests END,
        failed_tests = CASE WHEN new_status = 'failed' THEN failed_tests + 1 ELSE failed_tests END,
        updated_at = NOW()
    WHERE id = agent_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark stale agents as offline
CREATE OR REPLACE FUNCTION mark_stale_agents()
RETURNS INTEGER AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    WITH updated AS (
        UPDATE agents
        SET status = 'offline',
            updated_at = NOW()
        WHERE status != 'offline'
        AND last_heartbeat < NOW() - INTERVAL '30 seconds'
        RETURNING id
    )
    SELECT COUNT(*) INTO affected_rows FROM updated;
    
    -- Release tests from offline agents
    UPDATE test_cases
    SET status = 'pending',
        assigned_agent_id = NULL
    WHERE assigned_agent_id IN (
        SELECT id FROM agents WHERE status = 'offline'
    );
    
    RETURN affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

