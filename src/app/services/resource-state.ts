export type ResourceStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error';

export interface ResourceState<T> {
  status: ResourceStatus;
  data: T;
  error?: string;
  lastLoadedAt?: string;
}

export function createIdleState<T>(data: T): ResourceState<T> {
  return {
    status: 'idle',
    data,
  };
}
