import React from 'react';

import * as ReactDOM from 'react-dom';
import { Dynamico } from '@dynamico/core';

import { DynamicoContext, DynamicComponent } from '../lib';

const code = `
const React = require('react');

const ReactDOM = require('react-dom');

class Hello extends React.Component {  
  render() {
    // console.log(this);
    return React.createElement('div', null, this.props.yo);
  }

}

exports.default = Hello;
`;

localStorage.setItem('@dynamico/mycomp?appVersion=1', code);

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
