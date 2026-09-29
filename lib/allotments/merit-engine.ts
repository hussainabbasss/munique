/**
 * Gemini error classification shared by the batch merit engine
 * (lib/allotments/batch-engine.ts).
 */

/** Daily free-tier caps won't clear with short retries — stop the batch. */
export function isDailyQuotaExhausted(message: string) {
  return (
    /GenerateRequestsPerDayPerProjectPerModel|RequestsPerDayPerProject/i.test(
      message,
    ) && /quota|exceeded|429/i.test(message)
  );
}

/** Per-minute free-tier — wait and retry; do not abort the whole run. */
export function isMinuteQuotaExceeded(message: string) {
  return (
    /GenerateRequestsPerMinutePerProjectPerModel|RequestsPerMinute/i.test(
      message,
    ) && /quota|exceeded|429/i.test(message)
  );
}
