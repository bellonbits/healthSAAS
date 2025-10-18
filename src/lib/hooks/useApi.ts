import { useCallback } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '../api';

export const useApi = () => {
  const handleApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    options?: {
      successMessage?: string;
      onSuccess?: (data: T) => void;
      onError?: (error: string) => void;
      showError?: boolean;
    }
  ): Promise<T | null> => {
    const {
      successMessage,
      onSuccess,
      onError,
      showError = true
    } = options || {};

    try {
      const result = await apiCall();
      if (successMessage) {
        toast.success(successMessage);
      }
      if (onSuccess) {
        onSuccess(result);
      }
      return result;
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      if (showError) {
        toast.error(errorMessage);
      }
      if (onError) {
        onError(errorMessage);
      }
      return null;
    }
  }, []);

  return { handleApiCall };
};