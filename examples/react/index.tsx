import React from 'react';
import * as ReactDOM from 'react-dom';
import moment from 'moment';

import { DynamicoClient } from '@dynamico/core';
import { DynamicoProvider, dynamico } from '@dynamico/react';

interface MyCompProps {
  username: string;
}

const MyComp = dynamico<MyCompProps>('mycomp', {
  // devMode: true,
  // componentVersion: '1.1.2',
  // ignoreCache: true,
  fallback: <div>Loading...</div>
});

const App = () => {
  const dynamico = new DynamicoClient({
    url: '/api/components',
    hostVersion: '1.2.0',
    dependencies: {
      react: React,
      'react-dom': ReactDOM,
      moment: moment
    },
    cache: localStorage
  });

  return (
    <DynamicoProvider client={dynamico}>
      <MyComp username="Test">
        <span>testSpan</span>
      </MyComp>
    </DynamicoProvider>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
