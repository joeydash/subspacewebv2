'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ApiError {
  type: 'network' | 'server' | 'graphql' | 'timeout' | 'unknown';
  message: string;
}

function handleApiError(error: any): ApiError {
  const message = error?.message?.toLowerCase() || '';
  
  // Network errors
  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('connection') ||
    message.includes('offline') ||
    !navigator.onLine
  ) {
    return {
      type: 'network',
      message: 'Network connection error. Please check your internet connection.',
    };
  }
  
  // Server errors
  if (
    message.includes('server') ||
    message.includes('500') ||
    message.includes('503') ||
    message.includes('502')
  ) {
    return {
      type: 'server',
      message: 'Server error. Our team has been notified.',
    };
  }
  
  // GraphQL errors
  if (
    error?.graphQLErrors ||
    message.includes('graphql') ||
    message.includes('query') ||
    message.includes('mutation')
  ) {
    return {
      type: 'graphql',
      message: 'Data loading error. Please try again.',
    };
  }
  
  // Timeout errors
  if (message.includes('timeout') || message.includes('aborted')) {
    return {
      type: 'timeout',
      message: 'Request timeout. Please try again.',
    };
  }
  
  return {
    type: 'unknown',
    message: error?.message || 'An unexpected error occurred.',
  };
}

export default function GraphQLErrorHandler() {
  const router = useRouter();

  useEffect(() => {
    // Handle global errors
    const handleGlobalError = (event: ErrorEvent) => {
      // Only handle GraphQL errors
      if (
        event.error && 
        (event.error.graphQLErrors || 
         (event.error.message && event.error.message.includes('GraphQL')) ||
         (event.error.message && event.error.message.includes('No response')))
      ) {
        event.preventDefault();
        
        const apiError = handleApiError(event.error);
        
        // Redirect to error page for network or server errors
        if (apiError.type === 'network' || apiError.type === 'server') {
          router.push(`/error?type=${apiError.type}&message=${encodeURIComponent(apiError.message)}`);
        }
      }
    };

    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Handle GraphQL promise rejections
      if (
        event.reason && 
        (event.reason.graphQLErrors || 
         (event.reason.message && event.reason.message.includes('GraphQL')))
      ) {
        event.preventDefault();
        
        const apiError = handleApiError(event.reason);
        
        if (apiError.type === 'network' || apiError.type === 'server') {
          router.push(`/error?type=${apiError.type}&message=${encodeURIComponent(apiError.message)}`);
        }
      }
    };

    // Listen for errors
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [router]);

  return null;
}
