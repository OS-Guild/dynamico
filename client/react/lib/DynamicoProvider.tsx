import React, { FunctionComponent, useContext, useState } from 'react';
import { DevOptions, DynamicoClient, DynamicoDevClient } from '@dynamico/core';

export const DynamicoContext = React.createContext<DynamicoClient | undefined>(undefined);

export const DynamicoDevContext = React.createContext<boolean | Partial<DevOptions>>(false);

export interface DynamicoProviderProps {
  client: DynamicoClient;
  devMode?: boolean | Partial<DevOptions>;
}

export const DynamicoProvider: FunctionComponent<DynamicoProviderProps> = ({ client, devMode, children }) => {
  const parentDevMode = useContext(DynamicoDevContext);
  return (
    <DynamicoContext.Provider value={client}>
      <DynamicoDevContext.Provider value={devMode === undefined ? parentDevMode : devMode}>
        {children}
      </DynamicoDevContext.Provider>
    </DynamicoContext.Provider>
  );
};
