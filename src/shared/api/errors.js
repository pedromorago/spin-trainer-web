/** API error in RFC 7807 format (Problem Details). */
export class ApiError extends Error {
  constructor(problem, status) {
    super(problem?.detail ?? problem?.title ?? `HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.type = problem?.type ?? 'about:blank';
    this.title = problem?.title;
    this.problem = problem;
  }
  get isNotFound() { return this.status === 404; }
  get isConflict() { return this.status === 409; }
  /** No connection, a gateway error or a server still starting: retrying can fix it (ADR-0018). */
  get isTransient() { return this.status === 0 || this.status === 502 || this.status === 503 || this.status === 504; }
}
