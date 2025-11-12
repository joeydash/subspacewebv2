export interface ApiError {
  type: 'network' | 'server' | 'timeout' | 'unknown' | 'graphql' | 'auth';
  message: string;
  status?: number;
  originalError?: Error;
  graphQLErrors?: any[];
  retryable: boolean;
}

export const handleApiError = (error: any): ApiError => {
  // Check if we're offline first
  if (!navigator.onLine) {
    return {
      type: 'network',
      message: 'No internet connection. Please check your network and try again.',
      originalError: error,
      retryable: true
    };
  }

  // Handle fetch errors (network issues)
  if (error instanceof TypeError) {
    if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
      return {
        type: 'network',
        message: 'Network error. Please check your connection and try again.',
        originalError: error,
        retryable: true
      };
    }
  }

  // Handle timeout errors
  if (error.name === 'AbortError' || error.message?.includes('timeout')) {
    return {
      type: 'timeout',
      message: 'Request timed out. Please try again.',
      originalError: error,
      retryable: true
    };
  }

  // Handle Response object errors (when fetch succeeds but server returns error)
  if (error instanceof Response || (error && typeof error.status === 'number')) {
    const status = error.status;
    
    if (status === 401 || status === 403) {
      return {
        type: 'auth',
        message: 'Authentication error. Please log in again.',
        status: status,
        originalError: error,
        retryable: false
      };
    }
    
    if (status >= 500 && status < 600) {
      // 5xx errors are server errors
      return {
        type: 'server',
        message: 'Server error. Our servers are experiencing issues. Please try again later.',
        status: status,
        originalError: error,
        retryable: true
      };
    }
    
    if (status === 0 || !status) {
      // Status 0 usually means network error or CORS issue
      return {
        type: 'network',
        message: 'Network error. Please check your connection and try again.',
        status: status,
        originalError: error,
        retryable: true
      };
    }
    
    if (status >= 400 && status < 500) {
      // 4xx errors are client errors but we'll treat them as unknown for user-facing messages
      return {
        type: 'unknown',
        message: 'Something went wrong. Please try again.',
        status: status,
        originalError: error,
        retryable: status !== 404 // Don't retry 404s
      };
    }
  }

  // Handle GraphQL errors
  if (error.graphQLErrors && error.graphQLErrors.length > 0) {
    const graphQLError = error.graphQLErrors[0];
    
    // Check for authentication errors
    if (graphQLError.extensions?.code === 'UNAUTHENTICATED' || 
        graphQLError.message?.includes('authentication') ||
        graphQLError.message?.includes('not authorized')) {
      return {
        type: 'auth',
        message: 'Authentication error. Please log in again.',
        graphQLErrors: error.graphQLErrors,
        originalError: error,
        retryable: false
      };
    }
    
    // Check if it's a network-related GraphQL error
    if (graphQLError.message?.toLowerCase().includes('network')) {
      return {
        type: 'network',
        message: 'Network error. Please check your connection and try again.',
        graphQLErrors: error.graphQLErrors,
        originalError: error,
        retryable: true
      };
    }
    
    return {
      type: 'graphql',
      message: graphQLError.message || 'GraphQL error occurred. Please try again later.',
      graphQLErrors: error.graphQLErrors,
      originalError: error,
      retryable: true
    };
  }

  // Handle cases where there's no response at all
  if (error.message && (
    error.message.includes('ERR_NETWORK') ||
    error.message.includes('ERR_INTERNET_DISCONNECTED') ||
    error.message.includes('ERR_CONNECTION_REFUSED') ||
    error.message.includes('ERR_NAME_NOT_RESOLVED') ||
    error.message.toLowerCase().includes('network error')
  )) {
    return {
      type: 'network',
      message: 'Network error. Please check your connection and try again.',
      originalError: error,
      retryable: true
    };
  }

  // Handle server connection errors
  if (error.message && (
    error.message.includes('ERR_CONNECTION_RESET') ||
    error.message.includes('ERR_CONNECTION_ABORTED') ||
    error.message.includes('Internal Server Error') ||
    error.message.toLowerCase().includes('server error') ||
    error.message.toLowerCase().includes('service unavailable')
  )) {
    return {
      type: 'server',
      message: 'Server error. Our servers are experiencing issues. Please try again later.',
      originalError: error,
      retryable: true
    };
  }

  // Default to unknown error
  return {
    type: 'unknown',
    message: error.message || 'An unexpected error occurred. Please try again.',
    originalError: error,
    retryable: true
  };
};

// Enhanced fetch wrapper with proper error handling
export const fetchWithErrorHandling = async (
  url: string, 
  options: RequestInit = {},
  timeout: number = 10000
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Check if response is ok
    if (!response.ok) {
      throw response; // Throw the response object to be handled by error handler
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// GraphQL fetch wrapper with proper error handling
export const graphqlFetchWithErrorHandling = async (
  url: string,
  query: string,
  variables: any = {},
  authToken?: string,
  timeout: number = 10000
): Promise<any> => {
  try {
    const response = await fetchWithErrorHandling(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` })
      },
      body: JSON.stringify({
        query,
        variables
      })
    }, timeout);

    const data = await response.json();

    // Handle GraphQL errors
    if (data.errors && data.errors.length > 0) {
      const error = new Error(data.errors[0].message);
      (error as any).graphQLErrors = data.errors;
      throw error;
    }

    // Handle case where there's no data (server might be down)
    if (!data.data) {
      const error = new Error('No response data received from server');
      (error as any).type = 'server';
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Retry utility with exponential backoff
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Don't retry on certain error types
      const apiError = handleApiError(error);
      if (!apiError.retryable) {
        throw error; // Don't retry non-retryable errors
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};