import { z } from 'zod';

// Microsoft Graph API response schemas
export const MicrosoftUserSchema = z.object({
  id: z.string(),
  displayName: z.string().optional(),
  mail: z.string().email().optional(),
  userPrincipalName: z.string().email().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  officeLocation: z.string().optional(),
  businessPhones: z.array(z.string()).optional(),
  mobilePhone: z.string().optional(),
  photos: z.array(z.object({
    '@odata.mediaContentType': z.string(),
    '@odata.mediaEtag': z.string(),
    id: z.string(),
    height: z.number(),
    width: z.number(),
  })).optional(),
  picture: z.string().url().optional(),
});

export const MicrosoftPhotoSchema = z.object({
  '@odata.mediaContentType': z.string(),
  '@odata.mediaEtag': z.string(),
  id: z.string(),
  height: z.number(),
  width: z.number(),
});

export const MicrosoftErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    innerError: z.object({
      'request-id': z.string(),
      date: z.string(),
    }).optional(),
  }),
});

// Validation functions
export function validateMicrosoftUserResponse(data: any): {
  success: boolean;
  data?: z.infer<typeof MicrosoftUserSchema>;
  error?: string;
} {
  try {
    const result = MicrosoftUserSchema.safeParse(data);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return {
        success: false,
        error: `Validation failed: ${result.error.errors.map(e => e.message).join(', ')}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
    };
  }
}

export function validateMicrosoftPhotoResponse(data: any): {
  success: boolean;
  data?: z.infer<typeof MicrosoftPhotoSchema>;
  error?: string;
} {
  try {
    const result = MicrosoftPhotoSchema.safeParse(data);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return {
        success: false,
        error: `Photo validation failed: ${result.error.errors.map(e => e.message).join(', ')}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown photo validation error',
    };
  }
}

export function validateMicrosoftErrorResponse(data: any): {
  success: boolean;
  error?: z.infer<typeof MicrosoftErrorSchema>;
} {
  try {
    const result = MicrosoftErrorSchema.safeParse(data);
    
    if (result.success) {
      return { success: true, error: result.data };
    } else {
      return { success: false };
    }
  } catch (error) {
    return { success: false };
  }
}

// Microsoft Graph API error handling
export class MicrosoftGraphError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly requestId?: string;
  public readonly date?: string;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    requestId?: string,
    date?: string
  ) {
    super(message);
    this.name = 'MicrosoftGraphError';
    this.code = code;
    this.statusCode = statusCode;
    this.requestId = requestId;
    this.date = date;
  }
}

export function handleMicrosoftGraphError(error: any): MicrosoftGraphError {
  if (error instanceof MicrosoftGraphError) {
    return error;
  }

  // Handle HTTP errors
  if (error.status || error.statusCode) {
    const statusCode = error.status || error.statusCode;
    const errorData = error.body || error.data;
    
    if (errorData && typeof errorData === 'object') {
      const validation = validateMicrosoftErrorResponse(errorData);
      if (validation.success && validation.error) {
        return new MicrosoftGraphError(
          validation.error.error.message,
          validation.error.error.code,
          statusCode,
          validation.error.error.innerError?.['request-id'],
          validation.error.error.innerError?.date
        );
      }
    }

    return new MicrosoftGraphError(
      error.message || `HTTP ${statusCode}`,
      'HTTP_ERROR',
      statusCode
    );
  }

  // Handle network errors
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return new MicrosoftGraphError(
      'Network error: Unable to connect to Microsoft Graph API',
      'NETWORK_ERROR',
      0
    );
  }

  // Handle timeout errors
  if (error.code === 'ETIMEDOUT') {
    return new MicrosoftGraphError(
      'Request timeout: Microsoft Graph API did not respond in time',
      'TIMEOUT_ERROR',
      0
    );
  }

  // Generic error
  return new MicrosoftGraphError(
    error.message || 'Unknown Microsoft Graph API error',
    'UNKNOWN_ERROR',
    0
  );
}

// Avatar URL validation and processing
export function validateAndProcessMicrosoftAvatarUrl(
  userData: z.infer<typeof MicrosoftUserSchema>
): string | null {
  try {
    // Check photos array first (most reliable)
    if (userData.photos && Array.isArray(userData.photos) && userData.photos.length > 0) {
      const photo = userData.photos[0];
      if (photo.id) {
        // Construct the photo URL using the photo ID
        return `https://graph.microsoft.com/v1.0/me/photos/${photo.id}/$value`;
      }
    }

    // Check direct picture URL
    if (userData.picture && typeof userData.picture === 'string') {
      // Validate URL format
      try {
        new URL(userData.picture);
        return userData.picture;
      } catch {
        // Invalid URL, skip
      }
    }

    return null;
  } catch (error) {
    console.error('Error processing Microsoft avatar URL:', error);
    return null;
  }
}

// Token validation
export function validateMicrosoftAccessToken(token: string): {
  isValid: boolean;
  error?: string;
} {
  try {
    if (!token || typeof token !== 'string') {
      return { isValid: false, error: 'Token is required and must be a string' };
    }

    if (token.length < 10) {
      return { isValid: false, error: 'Token appears to be too short' };
    }

    // Basic JWT structure validation (header.payload.signature)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { isValid: false, error: 'Token does not appear to be a valid JWT' };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Token validation failed',
    };
  }
}

// Rate limiting and retry logic
export class MicrosoftGraphRateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly timeWindow: number; // in milliseconds

  constructor(maxRequests: number = 100, timeWindow: number = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    // Remove requests older than the time window
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    return this.requests.length < this.maxRequests;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }

  getWaitTime(): number {
    if (this.requests.length === 0) return 0;
    
    const oldestRequest = Math.min(...this.requests);
    const waitTime = this.timeWindow - (Date.now() - oldestRequest);
    
    return Math.max(0, waitTime);
  }
}

// Retry logic with exponential backoff
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Don't retry on certain error types
      if (error instanceof MicrosoftGraphError) {
        if (error.statusCode >= 400 && error.statusCode < 500) {
          // Client errors (4xx) should not be retried
          throw error;
        }
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
