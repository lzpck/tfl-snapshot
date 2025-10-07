// Declarações globais para TypeScript

// Interface para o cache em memória
interface MemoryCacheInterface {
  clear(): void;
  set<T>(key: string, data: T, ttlSeconds: number): void;
  get<T>(key: string): T | null;
  getOrFetch<T>(key: string, fetchFn: () => Promise<T>, ttlSeconds: number): Promise<T>;
}

declare global {
  var memoryCache: MemoryCacheInterface | undefined;
}

export {};