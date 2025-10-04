import supabase from '../lib/supabase.js';
import logger from '../lib/logger.js';

/**
 * Helper functions for managing test cases
 */

/**
 * Create a new test case
 */
export async function createTestCase(testCase) {
  try {
    const { data, error } = await supabase
      .from('test_cases')
      .insert(testCase)
      .select()
      .single();
    
    if (error) throw error;
    
    logger.info(`Test case created: ${data.id}`, { name: testCase.name });
    return data;
  } catch (error) {
    logger.error('Failed to create test case', { error });
    throw error;
  }
}

/**
 * Get test case by ID
 */
export async function getTestCase(id) {
  try {
    const { data, error } = await supabase
      .from('test_cases')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Failed to fetch test case', { error, id });
    throw error;
  }
}

/**
 * List all test cases with optional filters
 */
export async function listTestCases(filters = {}) {
  try {
    let query = supabase.from('test_cases').select('*');
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }
    
    query = query.order('priority', { ascending: false });
    query = query.order('created_at', { ascending: true });
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Failed to list test cases', { error });
    throw error;
  }
}

/**
 * Update test case
 */
export async function updateTestCase(id, updates) {
  try {
    const { data, error } = await supabase
      .from('test_cases')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    logger.info(`Test case updated: ${id}`);
    return data;
  } catch (error) {
    logger.error('Failed to update test case', { error, id });
    throw error;
  }
}

/**
 * Delete test case
 */
export async function deleteTestCase(id) {
  try {
    const { error } = await supabase
      .from('test_cases')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    logger.info(`Test case deleted: ${id}`);
  } catch (error) {
    logger.error('Failed to delete test case', { error, id });
    throw error;
  }
}

/**
 * Get test results for a test case
 */
export async function getTestResults(testCaseId) {
  try {
    const { data, error } = await supabase
      .from('test_results')
      .select(`
        *,
        agent:agents(name, browser_type),
        test_case:test_cases(name)
      `)
      .eq('test_case_id', testCaseId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Failed to fetch test results', { error, testCaseId });
    throw error;
  }
}

/**
 * Get test steps for a test result
 */
export async function getTestSteps(testResultId) {
  try {
    const { data, error } = await supabase
      .from('test_steps')
      .select('*')
      .eq('test_result_id', testResultId)
      .order('step_number', { ascending: true });
    
    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Failed to fetch test steps', { error, testResultId });
    throw error;
  }
}

export default {
  createTestCase,
  getTestCase,
  listTestCases,
  updateTestCase,
  deleteTestCase,
  getTestResults,
  getTestSteps,
};

