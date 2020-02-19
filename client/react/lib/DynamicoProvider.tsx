import React, { FunctionComponent } from 'react';
import { DevOptions, DynamicoClient } from '@dynamico/core';

export const DynamicoContext = React.createContext<DynamicoClient | undefined>(undefined);

export const DynamicoDevContext = React.createContext<boolean | Partial<DevOptions>>(false);

export interface DynamicoProviderProps {
  client: DynamicoClient;
  devMode?: boolean | Partial<DevOptions>;
}

export const DynamicoProvider: FunctionComponent<DynamicoProviderProps> = ({ client, devMode = false, children }) => (
  <DynamicoContext.Provider value={client}>
    <DynamicoDevContext.Provider value={devMode}>{children}</DynamicoDevContext.Provider>
  </DynamicoContext.Provider>
);
