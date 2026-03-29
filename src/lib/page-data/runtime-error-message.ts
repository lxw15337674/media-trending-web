import { classifyRuntimeError } from '@/lib/server/runtime-error';

interface StandardPageDataMessages {
  errorLoad: string;
  errorNoDbEnv: string;
  errorNoTable: string;
  errorQueryFailed: string;
}

export function resolveStandardPageDataErrorMessage(
  error: unknown,
  messages: StandardPageDataMessages,
  options?: { fallbackToErrorMessage?: boolean },
) {
  const category = classifyRuntimeError(error);
  if (category === 'missing_db_env') {
    return messages.errorNoDbEnv;
  }
  if (category === 'missing_table') {
    return messages.errorNoTable;
  }
  if (category === 'query_failed' || category === 'network' || category === 'auth') {
    return messages.errorQueryFailed;
  }
  if (options?.fallbackToErrorMessage && error instanceof Error) {
    return error.message;
  }
  return messages.errorLoad;
}
