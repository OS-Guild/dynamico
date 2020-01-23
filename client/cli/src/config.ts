import { resolve } from 'path';
import { cosmiconfig, defaultLoaders } from 'cosmiconfig';
import { DcmConfig } from './index';

const moduleName = 'dcm';

const searchPlaces = [
  'package.json',
  `.${moduleName}rc`,
  `${moduleName}config.json`,
  `${moduleName}config.js`,
  `${moduleName}config.ts`,
  `${moduleName}config.yml`,
  `${moduleName}config.yaml`
];

const loaders = {
  ...defaultLoaders,
  '.ts': filepath => {
    require('ts-node/register');
    const config = require(filepath);
    return config.default || config;
  }
};

export const getConfig = async (dir: string = '.'): Promise<DcmConfig | undefined> => {
  const workingDir = resolve(dir);
  const explorer = cosmiconfig(moduleName, { cache: false, searchPlaces, loaders, stopDir: workingDir });
  const result = await explorer.search(workingDir);
  return result?.config;
};

export const mergeConfigs = async (config: DcmConfig | undefined, dir?: string): Promise<DcmConfig | undefined> => {
  if (!dir || resolve(dir) === resolve()) {
    return config;
  }

  const workingConfig = await getConfig(dir);

  if (!config || !workingConfig) {
    return config || workingConfig;
  }

  return {
    registry: workingConfig.registry || config.registry,
    middleware: request => {
      if (config.middleware) {
        request = config.middleware(request);
      }
      if (workingConfig.middleware) {
        request = workingConfig.middleware(request);
      }
      return request;
    },
    modifyRollupConfig: rollupConfig => {
      if (config.modifyRollupConfig) {
        rollupConfig = config.modifyRollupConfig(rollupConfig);
      }
      if (workingConfig.modifyRollupConfig) {
        rollupConfig = workingConfig.modifyRollupConfig(rollupConfig);
      }
      return rollupConfig;
    }
  };
};
