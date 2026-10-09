/**
 * Friendly Error Mapping for LawGPT Mobile App
 * Critical Rule 8: Never expose raw server, SQL, or stack-trace errors to the citizen.
 */

export interface AppError {
  code: string;
  userMessage: string;
  technicalDetails?: string;
}

export function mapApiError(error: any): AppError {
  // Network / Offline errors
  if (!error || error.message === 'Network Error' || error.name === 'NetworkError' || error.code === 'ERR_NETWORK') {
    return {
      code: 'OFFLINE_OR_NETWORK_ERROR',
      userMessage: 'LawGPT is temporarily unavailable. Please check your internet connection and try again.',
      technicalDetails: error?.message,
    };
  }

  // Timeout errors
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.name === 'TimeoutError') {
    return {
      code: 'TIMEOUT',
      userMessage: 'The legal advisory request took longer than expected. Please tap retry.',
      technicalDetails: error?.message,
    };
  }

  // HTTP Status Errors
  const status = error.status || error.response?.status;

  if (status === 401) {
    return {
      code: 'UNAUTHORIZED',
      userMessage: 'Your session has expired. Please sign in again to continue.',
    };
  }

  if (status === 403) {
    return {
      code: 'FORBIDDEN',
      userMessage: 'You do not have access to this resource or legal feature.',
    };
  }

  if (status === 429) {
    return {
      code: 'RATE_LIMIT_EXCEEDED',
      userMessage: 'You have reached the query limit. Please wait a moment or sign up for full access.',
    };
  }

  if (status >= 500) {
    return {
      code: 'SERVER_ERROR',
      userMessage: 'Our legal intelligence service is currently undergoing routine maintenance. Please try again in a few moments.',
    };
  }

  // AI Generation or Parsing Failures
  if (error.code === 'AI_PARSE_ERROR') {
    return {
      code: 'AI_PARSE_ERROR',
      userMessage: 'LawGPT generated an answer that requires re-formatting. Falling back to plain text view.',
      technicalDetails: error?.message,
    };
  }

  // Generic fallback
  return {
    code: 'UNKNOWN_ERROR',
    userMessage: 'An unexpected issue occurred while processing your legal request. Please try again.',
    technicalDetails: error?.message,
  };
}
