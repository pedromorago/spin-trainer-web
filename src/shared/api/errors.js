/** Error de API en formato RFC 7807 (Problem Details). */
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
}
