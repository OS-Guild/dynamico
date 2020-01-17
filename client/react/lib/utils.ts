import { InitOptions } from '@dynamico/core';

export interface DependencyOptions {
  dependencies: InitOptions['dependencies'];
  globals?: Record<string, any>;
}

export const mergeDependencies = (a: DependencyOptions, ...options: Partial<DependencyOptions>[]): DependencyOptions =>
  options.reduce(
    (a: DependencyOptions, b) => ({
      dependencies: {
        versions: { ...a.dependencies.versions, ...b.dependencies?.versions },
        resolvers: { ...a.dependencies.resolvers, ...b.dependencies?.resolvers }
      },
      globals: { ...a.globals, ...b.globals }
    }),
    a
  );
