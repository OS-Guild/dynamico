import fetch from 'node-fetch';

import { PackageMetadata } from './typings';

const getDependencyMetadata = (name: string) =>
  fetch(`https://registry.npmjs.org/${name}`, {
    headers: { Accept: 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*' }
  }).then(r => r.json());

export const getVersionsForDependencies = async (deps: string[]) =>
  (await Promise.all(deps.map(d => getDependencyMetadata(d)))).reduce(
    (soFar: Record<string, string>, current: PackageMetadata) => ({
      [current.name]: current['dist-tags'].latest,
      ...soFar
    }),
    {}
  );
