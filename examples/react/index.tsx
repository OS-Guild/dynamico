import React from 'react';
import * as ReactDOM from 'react-dom';

import { DynamicoClient } from '@dynamico/core';
import { DynamicoContext, dynamico } from '@dynamico/react';

interface MyCompProps {
  test: string;
}

const MyComp = dynamico<MyCompProps>('mycomp', {
  // componentVersion: '1.1.2',
  // ignoreCache: true,
  fallback: <div>Loading...</div>
});

const App = () => {
  const dynamico = new DynamicoClient({
    url: '/api/components',
    appVersion: '1.2.1',        
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
