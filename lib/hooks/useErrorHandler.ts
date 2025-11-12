import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { handleApiError, ApiError } from '../utils/errorHandler';

  const router = useRouter();

  const handleError = useCallback((error: any, options?: {
    showErrorPage?: boolean;
    customMessage?: string;
    onError?: (error: ApiError) => void;
  }): ApiError => {
    const apiError = handleApiError(error);
    
    // Log error for monitoring
    console.error('Error handled:', apiError);
    
    // Call custom error handler if provided
    if (options?.onError) {
      options.onError(apiError);
    }
    
    // Navigate to error page for critical errors
    if (options?.showErrorPage !== false && (apiError.type === 'network' || apiError.type === 'server')) {
      router.replace(`/error?type=${apiError.type}&message=${encodeURIComponent(options?.customMessage || apiError.message)}&canRetry=true`);
    }
    
    return apiError;
  }, [router]);

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options?: {
      retries?: number;
      retryDelay?: number;
      showErrorPage?: boolean;
      customMessage?: string;
      onError?: (error: ApiError) => void;
    }
  ): Promise<T | null> => {
    const { retries = 0, retryDelay = 1000 } = options || {};
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await asyncFn();
      } catch (error) {
        const apiError = handleError(error, {
          showErrorPage: attempt === retries, // Only show error page on final attempt
          ...options
        });
        
        // Don't retry on client errors
        if (apiError.type === 'unknown' && apiError.status && apiError.status >= 400 && apiError.status < 500) {
          break;
        }
        
        // Wait before retrying
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        }
      }
    }
    
    return null;
  }, [handleError]);

  return {
    handleError,
    handleAsyncError
  };
};