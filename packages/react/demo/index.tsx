import React from 'react';

import * as ReactDOM from 'react-dom';
import { Dynamico } from '@dynamico/core';

import { DynamicoContext, DynamicComponent } from '../lib';

const Comp = `
const React = require('react');

const ReactDOM = require('react-dom');

class Hello extends React.Component {  
  render() {
    console.log(this);
    return React.createElement('div', null, this.props.yo);
  }

}

exports.default = Hello;
`;

const cache = new Map();

cache.set('mycomp', {code: Comp});

const App = () => {
  const dynamico = new Dynamico({
    url: 'http://localhost:3000/components',
    appVersion: '1',
    dependencies: {
      'react': React,
      'react-dom': ReactDOM
    },
    cache
  })
  return (
    <DynamicoContext.Provider value={dynamico}>
      <DynamicComponent component="mycomp" props={{yo: 'zxcv'}}></DynamicComponent>
    </DynamicoContext.Provider>
  )
};

ReactDOM.render(<App />, document.getElementById('root'));
