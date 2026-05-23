// #region agent log
export function debugLog(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>,
  runId = 'pre-fix'
) {
  fetch('http://127.0.0.1:7624/ingest/06240c99-d1e8-414f-87d8-3cb49497cc23', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '7b15e4' },
    body: JSON.stringify({
      sessionId: '7b15e4',
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
      runId,
    }),
  }).catch(() => {});
}
// #endregion
