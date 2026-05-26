type SupabaseLikeError = {
  code?: string;
  details?: string | null;
  hint?: string | null;
  message?: string;
};

export function throwSupabaseError(error: SupabaseLikeError): never {
  const parts = [
    error.message,
    error.code ? `Code: ${error.code}` : null,
    error.hint ? `Hint: ${error.hint}` : null,
    error.details ? `Details: ${error.details}` : null,
  ].filter(Boolean);

  throw new Error(parts.join(" "));
}
