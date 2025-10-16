/**
 * Safely parse JSON with error handling
 */
export function safeJsonParse<T = any>(text: string, fallback: T | null = null): T | null {
  try {
    if (!text || text.trim() === '') {
      console.warn('Attempted to parse empty or whitespace-only JSON');
      return fallback;
    }
    return JSON.parse(text);
  } catch (error) {
    console.error('JSON parsing error:', error);
    console.error('Text that failed to parse:', text.substring(0, 200));
    return fallback;
  }
}

/**
 * Safely fetch and parse JSON from a response
 */
export async function safeFetchJson<T = any>(response: Response): Promise<T | null> {
  try {
    const text = await response.text();
    return safeJsonParse<T>(text);
  } catch (error) {
    console.error('Fetch and parse error:', error);
    return null;
  }
}
