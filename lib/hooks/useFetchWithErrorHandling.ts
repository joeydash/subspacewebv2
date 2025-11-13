import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { handleApiError, ApiError } from '../utils/errorHandler';

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

export function useFetchWithErrorHandling<T = any>() {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: false,
    error: null
  });
  
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const fetchData = useCallback(async (
    url: string,
    options: RequestInit = {},
    redirectOnError: boolean = true
  ): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(user?.auth_token && { 'Authorization': `Bearer ${user.auth_token}` }),
          ...options.headers
        }
      });
      
      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
  logout();
  router.replace('/auth');
        throw new Error('Authentication failed. Please log in again.');
      }
      
      // Handle non-2xx responses
      if (!response.ok) {
        throw response;
      }
      
      // Handle empty responses
      if (response.status === 204) {
        setState({ data: null, loading: false, error: null });
        return null;
      }
      
      const data = await response.json();
      
      // Handle GraphQL errors
      if (data.errors && data.errors.length > 0) {
        // Check for auth errors in GraphQL response
        const authError = data.errors.find((err: any) => 
          err.extensions?.code === 'UNAUTHENTICATED' || 
          err.message?.includes('authentication') ||
          err.message?.includes('not authorized')
        );
        
        if (authError) {
          logout();
        //   navigate('/auth', { replace: true });
          throw new Error('Authentication failed. Please log in again.');
        }
        
        const error = new Error(data.errors[0].message);
        (error as any).graphQLErrors = data.errors;
        throw error;
      }
      
      // Handle case where there's no data (server might be down)
      if (!data) {
        const error = new Error('No response data received from server');
        (error as any).type = 'server';
        throw error;
      }
      
      setState({ data: data.data || data, loading: false, error: null });
      return data.data || data;
    } catch (error) {
      const apiError = handleApiError(error);
      setState({ data: null, loading: false, error: apiError });
      
      // Handle auth errors
      if (apiError.type === 'auth') {
        logout();
        // navigate('/auth', { replace: true });
        return null;
      }
      
      // Redirect to error page for network or server errors
      if (redirectOnError && (apiError.type === 'network' || apiError.type === 'server' || apiError.type === 'timeout')) {
        router.replace(`/error?type=${apiError.type}&message=${encodeURIComponent(apiError.message)}&canRetry=${apiError.retryable}`);
      }
      
      return null;
    }
  }, [user, logout]);
// }, [navigate, user, logout]);

  const graphqlFetch = useCallback(async (
    url: string,
    query: string,
    variables: any = {},
    redirectOnError: boolean = true
  ): Promise<T | null> => {
    return fetchData(
      url,
      {
        method: 'POST',
        body: JSON.stringify({ query, variables })
      },
      redirectOnError
    );
  }, [fetchData]);

  const retryFetch = useCallback(async (
    url: string,
    options: RequestInit = {},
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T | null> => {
    let retries = 0;
    let lastError: ApiError | null = null;
    
    while (retries <= maxRetries) {
      try {
        return await fetchData(url, options, false);
      } catch (error) {
        const apiError = handleApiError(error);
        lastError = apiError;
        
        // Don't retry auth errors or non-retryable errors
        if (apiError.type === 'auth' || !apiError.retryable) {
          break;
        }
        
        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, retries) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        retries++;
      }
    }
    
    // If we've exhausted retries, update state and redirect if needed
    if (lastError) {
      setState({ data: null, loading: false, error: lastError });
      
      if (lastError.type === 'auth') {
        logout();
        router.replace('/auth');
      } else if (lastError.type === 'network' || lastError.type === 'server' || lastError.type === 'timeout') {
        router.replace(`/error?type=${lastError.type}&message=${encodeURIComponent(lastError.message)}&canRetry=${lastError.retryable}`);
      }
    }
    
    return null;
  }, [fetchData, router, logout]);

  return {
    ...state,
    fetchData,
    graphqlFetch,
    retryFetch,
    resetState: () => setState({ data: null, loading: false, error: null })
  };
}