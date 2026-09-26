// Punto único de acceso a datos. Las features nunca importan httpClient ni mockApi directamente.
import { httpApi } from './httpClient';
import { mockApi } from './mock/mockApi';

export const api = import.meta.env.VITE_API_MODE === 'mock' ? mockApi : httpApi;
export { ApiError } from './errors';
