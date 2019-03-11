const React = require('react');
  
const ReactDOM = require('react-dom');

class Hello120 extends React.Component {

  render() {
    return React.createElement('div', null, '1.2.0/1.1.2', this.props.test, this.props.children);
  }

}
  
exports.default = Hello120;