# Dynamico Tutorial

In this tutorial, you're going to use a demo registry we've set up to host and serve components. The goal here is to try out the workflow with dynamico, and experience how easy it is to integrate and use dynamico.

We are going to create a new react app (or you can use an existing react application if you want) and integrate dynamico client into it. After that we're going to create a new component, developing it locally and publish it to a server and see it work in production mode. When we're done with that we will update the component and see the changes applied in your app.

This guide assumes you have a node version compatible with `create-react-app` (node 10 works fine), yarn and npx available.

## Host App

Let's start with creating an app (skip if you're using your own app):
```bash
$ npx create-react-app dynamico-demo
$ cd dynamico-demo
```

Now install the dependencies:
```bash
$ yarn add @dynamico/core @dynamico/react
```

Open `App.js` and add these import statements to the top of the file:
```javascript
import { DynamicoClient } from '@dynamico/core';
import { DynamicoProvider } from '@dynamico/react';
```

We import both dynamico client which is the client side 
library responsible for extracting components from the code 
and dynamico provider which is used to pass the client along on the context so you can use dynamic components just like a regular react component.

We're also going to need ReactDOM available in this scope so let's go ahead and import that too:
```javascript
import * as ReactDOM from 'react-dom';
```

Now we're going to initialize the client. It requires a few mandatory parameters. The first is the URL of the registry to be used in production. You can use the demo registry we've set up. the url is: `https://dynamico-demo-registry.soluto.io`.
To learn more about our registry head over to our [docs](./server/readme.md).
> Note: Components you publish to this registry are only available for a day, and are deleted a day after they're published.

The next is the storage to use for local caching of components. The API for the cache matches `localStorage`'s API so you can just pass it as the cache.

Last arguments are the dependencies the host app provides to dynamic components. We'll pass in just React and ReactDOM for now.
The dependencies object needs to get the versions of our dependencies and the resolvers for the actual objects. For versions we're just going to pass in our package.json file:
```javascript
import { dependencies } from '../package.json';
```

For the resolvers we'll define this object:
```javascript
const resolvers = {
  react: React,
  'react-dom': ReactDOM
};
```

And now we have everything we need to initialize the client. Add these lines to your code:
```javascript
const dynamicoClient = new DynamicoClient({
  url: 'https://dynamico-demo-registry.soluto.io',
  dependencies: {
    versions: dependencies,
    resolvers
  },
  cache: localStorage
});
```

Now we're going to initialize our react provider. Doing it is as easy as adding a single component to wrap the App's top level component:
```javascript
function App() {
  return (
      <DynamicoProvider client={dynamicoClient}>
        <div className="App">
        <header className="App-header">
            <img src={logo} className="App-logo" alt="logo" />
            <p>
            Edit <code>src/App.js</code>...
            </p>
            <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
            >
            Learn React
            </a>
        </header>
        </div>
    </DynamicoProvider>
  );
}
```

Now we can try and run the app:
```bash
$ yarn start
```

And nothing actually change, let's add dynamic components!

Let's add a dynamic component. Open App.js again and add dynamico to the import statement from `@dynamico/react`:
```javascript
import { DynamicoProvider, dynamico } from '@dynamico/react';
```

Now we're going to add a dynamic component to our host app.
Choose a unique name for your component as we're going to publish the code to a public server.
```javascript
const DynamicComponent = dynamico(<unique name of your component>, {
  fallback: <div>Loading...</div>
});
```
> Note: As a best practice you should define dynamic components in a separate file. For example here we would have created a new file that exports the result of the code here and import it in our `App.js` file.

Here we tell dynamico to get a component called `dynamiccomponent` and show `<div>Loading...</div>` In the meanwhile or if anything fails. There are more ways to retrieve dynamic components but this is the simplest way if you're using React.
> Note: The client doesn't try to download code until you actually try to render the component.

Let's try to render this component. Change the App's component code to look like this:
```javascript
function App() {
  return (
    <DynamicoProvider client={dynamicoClient}>
      <div className="App">
       <DynamicComponent />
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    </DynamicoProvider>
  );
}
```

We added our `DynamicComponent` right above the header tag. If we run the app again we see that some bar is added at the top of the screen that says `Loading...`. This is our fallback component. This happens because the client tries to get the code our dynamic component from the registry but we didn't publish it yet.

## Creating a component
To create a component you're going to need our [cli](./client/cli/readme.md):
```bash
$ yarn global add @dynamico/cli
```

Now you have the `dcm` command available in your CLI.
To create a new dynamic component we're going to create another folder at a different location from where we created our app. You should name the folder in the same name you used when you chose a name for your component. Open another terminal window and type:
```bash
$ mkdir <unique name of your component>
```

Now we're going to use `dcm` to initialize our component:
```bash
$ dcm init
```
This will present questions as to how do you want to develop and what is your target technology. Choose Javascript, React and leave the version with the default value (1.0.0). The output looks like this:
```bash
? What language are you developing in? Javascript
? What framework are you using? React
? What is version of your component? 1.0.0
✔  ++ ~/dynamiccomponent/index.jsx
✔  ++ ~/dynamiccomponent/package.json
✔  ++ ~/dynamiccomponent/dcmconfig.js
```

We now have three new files in our folder. index.jsx which is the entry point for our component's code. A packge.json file which is used to specify the component's version and dependencies. And a file called dcmconfig.js which is a javascript file that's used to configure the dcm CLI operations on your component.
Let's start developing by installing dependencies:
```bash
$ yarn
```

Now let's start dynamico's development server:
```bash
$ dcm start
```

Now dcm bundles your code and serves it in `http://localhost:8383`. Navigate and see the output, this is your bundled code.
Let's get back to the app and start using this code. Open your App.js file and change the component to be in dev mode:
```javascript
const DynamicComponent = dynamico(<unique name of your component>, {
  devMode:true,
  fallback: <div>Loading...</div>
});
```

Run the app and look at the top bar. It should say `Your Dynamiccomponent component` (of course, instead of `Dynamiccomponent` it would use the unique name you chose) which is exactly what we export from the component's code!

Let's change the component's code. Open index.js in the component folder and change the component's jsx to:
```javascript
const Dynamiccomponent = () => (
  <div>
    <span>This is fun!</span>
  </div>
);
```

Note that as you save your app gets updated automatically.

Now let's publish the component. Got to your terminal, stop the dcm development server, and open `dcmconfig.js`. You'll see that this file exports an object with a `registry` property. It expects to have a URL of an available registry. You should use the same URL you used when you set up dynamico client in the app:
```javascript
exports.default = {
  registry: 'https://dynamico-demo-registry.soluto.io'
};
```

Now go back to your terminal in your component's folder and run:
```bash
$ dcm publish
```

You should see:
```bash
17:29:16 [dcm] info: Publishing...
success Bundled ~/<unique name of your component>/index.jsx in cjs format (559ms)
┌─────────────────────────────┐
│File           Size   Gzipped│
│dist/index.js  290 B  203 B  │
└─────────────────────────────┘
17:29:20 [dcm] info: Successfully published Dynamiccomponent@1.0.0
```

> Note: If you get a 500 error it might be because there's already a component with the same name. Change the name of the component in `package.json` and in `App.js` and try again.

Now let's try and use it in the app. Open App.js and remove devMode property from the dynamic component's creation:
```javascript
const DynamicComponent = dynamico('dynamiccomponent', {
  fallback: <div>Loading...</div>
});
```

Run the app again and you can see that it takes a bit longer for the component to load but eventually you'll see your component's code! On subsequent loads of the app the code will be taken from the cache you provided earlier to the client.

## Updating the component
For our last example we'll update the component's code and publish our changes. For this example we'll also add a dependency directly to the component's code.
> Note: As a best practice all of your components' dependencies should be provided by the host app to keep components small. Only use dependencies in the component when you can't update the host app.

Let's start by adding our dependency. For our example we'll use `lodash`. Open your terminal and navigate to the folder of your component you created earlier:
```bash
$ yarn add lodash
```
> Note: Dynamico uses `Rollup` under the hood, which has tree-shaking and will only bundle up the code you actually used.

Open `index.jsx` in the component's code and add the following import statement:
```javascript
import _ from 'lodash';
```

Now update the component to actually use the `lodash`:
```javascript
const Dynamiccomponent = () => (
  <div>
    <span>{_.now()}</span>
  </div>
);
```

Now we updated our component, but we still need to test it out locally. Go to your terminal window again and type:
```bash
$ dcm start
```

You can go to `http://localhost:8383` in your browser to see the updated code. You'll notice it bundles `lodash`'s code along with yours. This is `dcm`'s [internal bundler work](https://github.com/egoist/bili).

Open `App.js` in the host app you created earlier and set your component to work in dev mode:
```javascript
const DynamicComponent = dynamico(<unique name of your component>, {
  devMode:true,
  fallback: <div>Loading...</div>
});
```

Run the app and see at the top bar that the current unix time label is displayed!
Now we want to publish our updated component. Go to you component's `package.json` file and bump the version:
```json
  "version": "1.0.1",
```

Now go to your terminal, and in the component's folder run:
```bash
$ dcm publish
```

Go back to `App.js` in your host app and remove the `devMode` property from the dynamic component:
```javascript
const DynamicComponent = dynamico(<unique name of your component>, {
  fallback: <div>Loading...</div>
});
```

Refresh the page and see the updated component served to your host app!

Now you can head out to read more about the [registring]('./Server/readme.md') or go [here]('./Client/readme.md') to learn more about the client side. You can also head out to our [Getting Started]('./getting-started.md') to set up your own environment. If you want to check out an entire example you can look at our [example]('./examples/react').
