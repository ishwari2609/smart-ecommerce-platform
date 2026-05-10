/**
 * Secure fetch wrapper that handles auth-related errors gracefully
 * Suppresses non-critical 403 errors during auth transitions
 */
export const secureFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    // For 403 errors that aren't critical, return a silent failure
    // This prevents console spam during auth state transitions
    if (response.status === 403) {
      // Only log 403 if it's from an authenticated endpoint
      const token = localStorage.getItem("token");
      if (!token) {
        // Expected 403 when not authenticated - suppress
        return { ok: false, status: 403, message: "Not authenticated" };
      }
    }

    return response;
  } catch (error) {
    // Network errors - suppress details to reduce noise
    console.debug("Network request failed:", error.message);
    throw error;
  }
};

export default secureFetch;
