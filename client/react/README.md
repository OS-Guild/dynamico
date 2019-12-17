# Dynamico React client

The react client is the glue between the functionallity in [@dynamico/core]() and the dynamic components registry

## Installation
``` bash
$ yarn add @dynamico/react
```

## Usage
### Creating the client

```tsx
import React from 'react';
import { render } from 'react-dom';

import { DynamicoClient } from '@dynamico/core';
import { DynamicoProvider } from '@dynamico/react';

import { dependencies as hostVersions } from './package.json'

const dynamicoClient = new DynamicoClient({
  url: '/api/components',
  dependencies: {
    versions: hostVersions,
    resolvers: {
      react: React
    }
  },
  cache: localStorage
});

const App = () => (
  <DynamicoProvider client={dynamicoClient}>
    <!-- your app -->    
  </DynamicoProvider>
);

render(<App />, document.getElementById('root'));
```

By using `DynamicoProvider` component we expose the client by react context to all child components.

using this technique at the root level guarantees that the client is always initiated and available to any component in the tree.


### Using a dynamic component
```tsx
import React from 'react';
import { dynamico } from '@dynamico/react';

const MyComp = dynamico('mycomp');

export default () => (
  <MyComp myProp="dynamico"></MyComp> // use a a regular React component
)

```

Once you created your dynamic component you can use it as a regular react component, including passing props and children.

Your dynamic component can look like this
```tsx
import React from 'react';

export default ({myProp, children}) => (
  <div>
    <span>{myProp} is awesome</span>
    {children}
  </div>
)
```

### `dynamico` Properties
#### name
* Type: `string`

The requested dynamic component name

#### options - (optional)
dynamico accepts a second optional parameter that extends [DynamicoClient.Options](https://hackmd.io/ITHxQc_6TO2hEIFhiTSMnA?both#Options) and provides some more control for this specific component.

##### fallback
* Type: `Element`

A fallback element to render while the dynamic component is loading
> Best Practice: Although this is optional we highly recommend you provide a fallback component whenever possible. This will allow you to provide a proper UX.

##### devMode
* Type: `boolean`
* Default: `false`

Specifies if the current component should be required from localhost dev server or fetched from production server/cache.


### Typescript support
If you use typescript, you can type the component properties
```typescript
import React from 'react';
import { dynamico } from '@dynamico/react';

interface MyCompProps {
  myProp: string
}

const MyComp = dynamico<MyCompProps>('mycomp');

export default () => (
  <MyComp myProp="dynamico"></MyComp>
)
```

> Note: If you end up publishing your component to npm, you can install it's types as a dev dependency and get them from your dynamic component 🤯
