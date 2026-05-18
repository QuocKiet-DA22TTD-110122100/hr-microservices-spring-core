import { AxiosError } from 'axios';

interface ErrorPayload {
  message?: string;
  error?: string;
}

export const getApiErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  const axiosError = error as AxiosError<ErrorPayload>;

  if (axiosError?.response?.data?.message) {
    return axiosError.response.data.message;
  }

  if (axiosError?.response?.data?.error) {
    return axiosError.response.data.error;
  }

  if (axiosError?.message) {
    return axiosError.message;
  }

  return fallback;
};
