// Single data access point. Features never import httpClient or mockApi directly.
import { httpApi } from './httpClient';
import { mockApi } from './mock/mockApi';
import { USES_MOCK_DATA } from '../mode';

export const api = USES_MOCK_DATA ? mockApi : httpApi;
export { ApiError } from './errors';
