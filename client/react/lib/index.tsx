import React, { useState, useEffect, useContext, FunctionComponent } from 'react';
import { DynamicoClient, DynamicoDevClient, Options, DevOptions } from '@dynamico/core';
import { Omit } from 'type-fest';
import { isElement } from 'react-is';

const enum ComponentStatus {
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

type FallbackType<T> = JSX.Element | React.ComponentType<T & DynamicoStatus> | null;

interface ComponentOptions<T> extends Options {
  devMode?: boolean | Partial<DevOptions>;
  fallback?: FallbackType<T>;
}

export const DynamicoContext = React.createContext<{ client?: DynamicoClient; devClient?: DynamicoDevClient }>({});

export interface DynamicoProviderProps {
  client: DynamicoClient;
  devMode?: boolean | Partial<DevOptions>;
}

export const DynamicoProvider: FunctionComponent<DynamicoProviderProps> = ({ client, devMode, children }) => {
  const context = React.useMemo(() => {
    if (!devMode) {
      return { client };
    }

    const devClient = new DynamicoDevClient({
      dependencies: client.dependencies,
      ...(typeof devMode === 'object' ? devMode : {})
    });

    return { client, devClient };
  }, [client, devMode]);

  return <DynamicoContext.Provider value={context}>{children}</DynamicoContext.Provider>;
};

interface FallbackBuilderProps<T> {
  fallback: FallbackType<T> | null;
  status: Status;
  [propName: string]: any;
}

const FallbackBuilder = <T extends {}>({ fallback, status, ...props }: FallbackBuilderProps<T>) => {
  if (!fallback || isElement(fallback)) {
    return fallback;
  }
  const FallbackComponent = fallback as React.ComponentType<any>;
  return <FallbackComponent dynamicoStatus={status} {...props} />;
};

export const dynamico = function<T = any>(
  name: string,
  { fallback = null, devMode = false, ...options }: ComponentOptions<T> = {}
): FunctionComponent<T> {
  return (props: T) => {
    const [Component, setComponent]: [Component, setComponent] = useState({});
    const [status, setStatus]: [Status, setStatus] = useState<Status>({ currentStatus: ComponentStatus.Loading });

    const { client: dynamicoClient, devClient } = useContext(DynamicoContext);

    useEffect(() => {
      let release = () => {};

      const setError = (error: Error) => setStatus({ currentStatus: ComponentStatus.Error, error });

      const getComponent = async () => {
        if (!dynamicoClient) {
          throw `Couldn't find dynamico client in the context, make sure you use DynamicoContext.Provider`;
        }

        if (devMode === false || (!devMode && !devClient)) {
          setComponent({ view: await dynamicoClient.get(name, options) });
          return;
        }

        const devOptions = typeof devMode === 'object' ? devMode : {};

        const client =
          devClient ||
          new DynamicoDevClient({
            dependencies: dynamicoClient.dependencies,
            ...devOptions
          });

        let usingFallbackComponent = false;

        release = client.get(name, {
          interval: devOptions.interval,
          ...options,
          callback: async (err, view: any) => {
            if (!err) {
              usingFallbackComponent = false;
              return setComponent({ view });
            }

            console.warn(`failed getting component ${name} from dev server`, err);

            if (!devMode) {
              return setError(err);
            }

            if (usingFallbackComponent) {
              return;
            }
            usingFallbackComponent = true;

            try {
              setComponent({ view: await dynamicoClient.get(name, options) });
            } catch (e) {
              return setError(e);
            }
          }
        });
      };

      getComponent().catch(setError);

      return () => release();
    }, []);

    return Component.view ? (
      <Component.view {...props} />
    ) : (
      <FallbackBuilder fallback={fallback} status={status} {...props} />
    );
  };
};
