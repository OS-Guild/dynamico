import React, { useState, useEffect, useContext, FunctionComponent } from 'react';
import { DynamicoClient, DynamicoDevClient, Options, DevOptions } from '@dynamico/core';
import { Omit } from 'type-fest';
import { isElement } from 'react-is';

enum ComponentStatus {
  Loading = 'loading',
  Error = 'error'
}

interface Status {
  currentStatus: ComponentStatus;
  error?: Error;
}

interface setStatus {
  (status: Status): void;
}

export interface DynamicoStatus {
  dynamicoStatus: Status;
}

interface Component {
  view?: FunctionComponent;
}

interface setComponent {
  (component: Component): void;
}

type FallbackType<T> = JSX.Element | React.ComponentType<T & DynamicoStatus> |  null;

interface ComponentOptions<T> extends Options {
  devMode?: boolean | Partial<Omit<DevOptions, 'callback'>>;
  fallback?: FallbackType<T>;
}

export const DynamicoContext = React.createContext<DynamicoClient | undefined>(undefined);

export const DynamicoProvider: FunctionComponent<{ client: DynamicoClient }> = ({ client, children }) => (
  <DynamicoContext.Provider value={client}>{children}</DynamicoContext.Provider>
);

interface FallbackBuilderProps<T> {
  fallback: FallbackType<T> | null;
  status: Status;
  [propName: string] : any;
}

const FallbackBuilder = <T extends {}>({fallback, status, ...props}: FallbackBuilderProps<T>) => {
  if (!fallback || isElement(fallback)) {
    return fallback;
  }
  const FallbackComponent = fallback as React.ComponentType<any>;
  return <FallbackComponent dynamicoStatus={status} {...props} />;
}

export const dynamico = function<T = any>(
  name: string,
  { fallback = null, devMode = false, ...options }: ComponentOptions<T> = {}
): FunctionComponent<T> {
  return (props: T) => {
    const [Component, setComponent]: [Component, setComponent] = useState({});
    const [status, setStatus]: [Status, setStatus] = useState<Status>({currentStatus: ComponentStatus.Loading});
    
    const dynamicoClient = useContext<DynamicoClient | undefined>(DynamicoContext);
    let release = () => {};

    const getComponent = async () => {
      if (!dynamicoClient) {
        throw `Couldn't find dynamico client in the context, make sure you use DynamicoContext.Provider`;
      }
      if (devMode) {
        const devClient = new DynamicoDevClient({
          dependencies: dynamicoClient.dependencies,
          ...(typeof devMode === 'object' ? devMode : {}),
          callback: (view: any) => setComponent({ view })
        });

        release = await devClient.get(name, options);

        return;
      }
      
      setComponent({ view: await dynamicoClient.get(name, options) });
    };

    useEffect(() => {
      
        getComponent().catch ((error) => {
          setStatus({
            currentStatus: ComponentStatus.Error,
            error
          });
      });

      return () => release();
    }, []);

    return Component.view ? <Component.view {...props} /> : <FallbackBuilder fallback={fallback} status={status} {...props} />;
  };
};
