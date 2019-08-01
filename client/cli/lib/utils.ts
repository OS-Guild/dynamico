import { resolve } from 'path';
import { writeFileSync } from 'fs';

type Dependencies = Record<string, string>;

const dir = process.cwd();
export const getPackageJsonPath = () => resolve(dir, `package.json`);

export const getPackageJson = () => require(getPackageJsonPath());

export const updatePackageJson = newContents =>
  writeFileSync(getPackageJsonPath(), JSON.stringify(newContents, null, 2));

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
