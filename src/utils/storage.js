import supabase from '../lib/supabase.js';
import logger from '../lib/logger.js';

/**
 * Upload screenshot to Supabase Storage
 */
export async function uploadScreenshot(path, buffer) {
  try {
    const { data, error } = await supabase
      .storage
      .from('test-screenshots')
      .upload(path, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });
    
    if (error) {
      logger.error('Failed to upload screenshot', { error, path });
      throw error;
    }
    
    return data;
  } catch (error) {
    logger.error('Screenshot upload error', { error });
    throw error;
  }
}

/**
 * Get public URL for a screenshot
 */
export function getScreenshotUrl(path) {
  const { data } = supabase
    .storage
    .from('test-screenshots')
    .getPublicUrl(path);
  
  return data.publicUrl;
}

/**
 * Delete screenshot from storage
 */
export async function deleteScreenshot(path) {
  try {
    const { error } = await supabase
      .storage
      .from('test-screenshots')
      .remove([path]);
    
    if (error) {
      logger.error('Failed to delete screenshot', { error, path });
      throw error;
    }
  } catch (error) {
    logger.error('Screenshot deletion error', { error });
    throw error;
  }
}

export default {
  uploadScreenshot,
  getScreenshotUrl,
  deleteScreenshot,
};

