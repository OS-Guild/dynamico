import React from 'react';
import * as ReactDOM from 'react-dom';

import { Dynamico } from '@dynamico/core';
import { DynamicoContext, DynamicComponent } from '@dynamico/react';


const App = () => {
  const dynamico = new Dynamico({    
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
      <DynamicComponent component="mycomp" props={{yo: 'elad'}}>
        <div>Loading...</div>
      </DynamicComponent>
    </DynamicoContext.Provider>
  )
};

ReactDOM.render(<App />, document.getElementById('root'));
