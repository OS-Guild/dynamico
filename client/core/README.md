# Dynamico core
A framework agnostic client for fetching and evaluating remote dynamic components

## Installation
``` bash
$ yarn add @dynamico/core
```

## Usage
* [Client](#DynamicoClient)
* [Development Client](#DynamicoDevClient)

### DynamicoClient
#### Creating a client
The client must define the registry end-point, components delegated depedencies, and cache and optionally control much more.
```typescript
import { dependencies as hostVersions } from './package.json';

const dynamico = new DynamicoClient({
  url: '/api/components', 
  dependencies: {
    versions: hostVersions,
    resolvers: {
      react: React
    }
  },
  cache: localStorage
});
```

> Note: in react, the client is provided through react context to the components loader

##### Properties
**url**
* Type: `string`

Registry url
> Best Practice: proxy the request through your server to the dynamico registry server in order to prevent CORS


**depedencies**

###### versions
* Type: `Record<string, string>`

Host application dependencies versions.
This is a crucial information for the dynamico registry in order to resolve the best available dynamic component version.


###### resolvers
* Type: `Record<string, any>`

The delegated and shared depedencies we pass to the evaluation of the component.

Dynamic comonents should always *try* to share it's depedencies with it's host application.

**cache**
* Type: `StorageController`

A cache storage for storing fetched components for offline usage and memoization

> Best Practice: use the default storage such as [localStorage](https://developer.mozilla.org/en/docs/Web/API/Window/localStorage) or [AsyncStorage](https://facebook.github.io/react-native/docs/asyncstorage)

**fetcher - (optional)**
* Type: `GlobalFetch['fetch']`

The fetcher that the client should use. This has to conform to the browser's `fetch` [API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API).
By default the client will look for the global `window.fetch`. For other environments you can use [node-fetch](https://www.npmjs.com/package/node-fetch)

> Best Practice: Use this property if you want to use a different HTTP client or you do SSR

**globals - (optional)**
* Type: `Record<string, any>`

A way to expose global variables on the evaluated component

#### Fetching a component

```typescript
dynamico.get('MyComponent', options);
```
##### Options
As the name implies, these are all optional:

**componentVersion**

- Type: `string`
  Force the client to provide the component at a specific version and skip the normal resolution strategy.

**getLatest**

- Type: `boolean`
  Skip local cache lookup and index and go straight to the server to fetch the latest component's code.

**globals**
* Type: `Record<string, any>`
Additional globals you would like to expose in the context of this specific component's evaluation.

### DynamicoDevClient
#### Creating a dev client
```typescript
export interface DevOptions {
  dependencies: {
    versions: Record<string, string>,
    resolvers: Record<string, any>
  };
  callback: Function;
  interval?: number;
  urlOverride?: string;
}

const dynamicoDev = new DynamicoDevClient({
  dependencies: {
    versions: hostVersions,
    resolvers: {
      react: React
    }
  },
  callback: view => RenderComponent(view) // Render the component to the screen
});
```

The dev client extends the basic client and enables a live reload development experience by polling a local development server.

#### Properties
**dependencies.versions** and **dependencies.resolvers** are the same as at the regular client
##### callback
* Type: `Function`

A callback function that's called everytime the remote code has changed
> Note: Use this function to commit the code changes (i.e. in React, trigger the render function)

##### interval - (optional)
* Type: `number`
* Default:  `1000` milliseconds.

The polling mechanisem interval - time in milliseconds.


**urlOverride - (optional)**
* Type: `string`
* Default: `DYNAMICO_DEVELOPMENT_SERVER` environment variable or `http://localhost:8383`

The dev repository url

#### Fetching a component in development mode
```typescript
dynamicoDev.get('MyComponent', options);
```
Supported options are the same as [regular client options](#Options).
