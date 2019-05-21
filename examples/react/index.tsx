import React from 'react';
import * as ReactDOM from 'react-dom';
import moment from 'moment';

import { DynamicoClient } from '@dynamico/core';
import { DynamicoProvider, dynamico } from '@dynamico/react';

import { dependencies } from './package.json';

interface MyCompProps {
  username: string;
}

const MyComp = dynamico<MyCompProps>('mycomp', {
  // devMode: true,
  // componentVersion: '1.1.2',
  // ignoreCache: true,
  fallback: <div>Loading...</div>
});

const resolvers = {
  react: React,
  'react-dom': ReactDOM,
  moment: moment
};

const dynamicoClient = new DynamicoClient({
  url: '/api/components',
  dependencies: {
    versions: dependencies,
    resolvers
  },
  cache: localStorage
});

const App = () => (
  <DynamicoProvider client={dynamicoClient}>
    <MyComp username="Test">
      <span>testSpan</span>
    </MyComp>
  </DynamicoProvider>
);

ReactDOM.render(<App />, document.getElementById('root'));
