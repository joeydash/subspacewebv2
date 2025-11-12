import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { handleApiError, ApiError } from '../utils/errorHandler';

  const router = useRouter();

  const handleError = useCallback((error: any): ApiError => {
    const apiError = handleApiError(error);
    // For critical errors, navigate to error page
    if (apiError.type === 'network' || apiError.type === 'server') {
      router.replace(`/error?type=${apiError.type}&message=${encodeURIComponent(apiError.message)}&canRetry=true`);
    }
    return apiError;
  }, [router]);

  return { handleError };
};