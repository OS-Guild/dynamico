import { resolve } from 'path';

type Dependencies = Record<string, string>;

const dir = process.cwd();

export const getPackageJson = () => require(resolve(dir, `package.json`));

export const getMainFile = (): string => {
  const { main } = getPackageJson();

  if (!main) {
    throw `package.json is missing "main" file`;
  }

  return main;
};

export const validateDependencies = (host: Dependencies, client: Dependencies) => {
  Object.entries(client).forEach(([dep, version]) => {
    if (host[dep] && host[dep] !== version) {
      console.warn(
        `WARNING: host version recieved for ${dep} was ${
          host[dep]
        } but component version is asking for ${version}. Please consider matching the versions in order to prevent problems.`
      );
    }
  });
};
