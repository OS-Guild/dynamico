import React from 'react';
import * as ReactDOM from 'react-dom';

import { DynamicoClient } from '@dynamico/core';
import { DynamicoContext, dynamico } from '@dynamico/react';

interface MyCompProps {
  test: string;
}

const MyComp = dynamico<MyCompProps>('mycomp', {
  fallback: <div>Loading...</div>
});

const App = () => {
  const dynamico = new DynamicoClient({
    url: 'http://localhost:3000/components',
    appVersion: '1',
    dependencies: {
      'react': React,
      'react-dom': ReactDOM
    },
    cache: localStorage
  })
  return (
    <DynamicoContext.Provider value={dynamico}>
      <MyComp test="testProp">
        <span>testSpan</span>
      </MyComp>
    </DynamicoContext.Provider>
  )
};

ReactDOM.render(<App />, document.getElementById('root'));
