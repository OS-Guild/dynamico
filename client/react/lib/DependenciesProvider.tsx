import React, { FunctionComponent, useContext, useMemo } from 'react';
import { DynamicoClient, filterDependencies } from '@dynamico/core';
import { DynamicoContext } from './DynamicoProvider';
import { DependencyOptions, mergeDependencies } from './utils';

export interface DependenciesProviderProps extends DependencyOptions {}

export const DependenciesProvider: FunctionComponent<DependenciesProviderProps> = ({
  children,
  globals,
  dependencies
}) => {
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
        ...mergeDependencies(client, { dependencies: filterDependencies(dependencies), globals })
      }),
    [client, dependencies, globals]
  );

  return <DynamicoContext.Provider value={overrideClient}>{children}</DynamicoContext.Provider>;
};
