// Single data access point. Features never import httpClient or mockApi directly.
import { httpApi } from './httpClient';
import { mockApi } from './mock/mockApi';

export const api = import.meta.env.VITE_API_MODE === 'mock' ? mockApi : httpApi;
export { ApiError } from './errors';
