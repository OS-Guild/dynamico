import React, { FunctionComponent, useContext, useMemo } from 'react';
import { DynamicoClient } from '@dynamico/core';
import { DynamicoContext } from './DynamicoProvider';
import { DependencyOptions, mergeDependencies } from './utils';

export interface DependenciesProviderProps extends Partial<DependencyOptions> {}

export const DependenciesProvider: FunctionComponent<DependenciesProviderProps> = ({ children, ...options }) => {
  const client = useContext(DynamicoContext);
  const overrideClient = useMemo(
    () =>
      client &&
      new DynamicoClient({
        url: client.url,
        cache: client.cache,
        fetcher: client.fetcher,
        checkCodeIntegrity: client.checkCodeIntegrity,
        failedRegisterPolicy: client.failedRegisterPolicy,
        ...mergeDependencies(client, options)
      }),
    [client, options.dependencies, options.globals]
  );

  return <DynamicoContext.Provider value={overrideClient}>{children}</DynamicoContext.Provider>;
};
