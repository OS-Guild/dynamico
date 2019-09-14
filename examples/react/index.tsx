import React, { useState } from 'react';
import * as ReactDOM from 'react-dom';
import moment from 'moment';

import { DynamicoClient } from '@dynamico/core';
import { DynamicoProvider, dynamico, Status } from '@dynamico/react';

import { dependencies } from './package.json';

interface MyCompProps {
  username: string;
}

const MyComp = dynamico<MyCompProps>('mycomp', {
  // devMode: true,
  // componentVersion: '1.1.2',
  // getLatest: true,
  fallback: ({username, dynamicoStatus}) => <div>Hey {username}, I'm currently {dynamicoStatus.currentStatus} with {dynamicoStatus.error && dynamicoStatus.error.stack}... </div>
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

const App = () => {
  const [visible, setVisible] = useState(true);
  return (
    <DynamicoProvider client={dynamicoClient}>
      <input type="checkbox" checked={visible} onChange={() => setVisible(!visible)} /> show component
      {visible && (
        <MyComp username="Test">
          <span>testSpan</span>
        </MyComp>
      )}
    </DynamicoProvider>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
