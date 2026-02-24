import type { AxiosError } from 'axios';

type ValidationErrors = Record<string, string[] | string>;

type ApiErrorResponse = {
  message?: string;
  errors?: ValidationErrors;
};

function extractValidationMessage(errors?: ValidationErrors): string | undefined {
  if (!errors || typeof errors !== 'object') {
    return undefined;
  }

  for (const value of Object.values(errors)) {
    if (Array.isArray(value) && value.length > 0) {
      const [firstError] = value;

      if (typeof firstError === 'string' && firstError.trim()) {
        return firstError;
      }
    }

    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return undefined;
}

function isGenericUnexpectedMessage(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  return normalized === 'unexpected error' || normalized === 'an unexpected error occurred';
}

export function resolveApiErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<ApiErrorResponse>;

  if (axiosError?.isAxiosError) {
    const responseData = axiosError.response?.data;
    const message = responseData?.message;

    if (typeof message === 'string' && message.trim()) {
      return isGenericUnexpectedMessage(message) ? fallback : message;
    }

    const validationMessage = extractValidationMessage(responseData?.errors);

    if (validationMessage) {
      return validationMessage;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}
