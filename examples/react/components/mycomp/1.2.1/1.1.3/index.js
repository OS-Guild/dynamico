const React = require('react');
  
const ReactDOM = require('react-dom');

class Hello121113 extends React.Component {

  render() {
    return React.createElement('div', null, '1.2.1/1.1.3', this.props.test, this.props.children);
  }

}
  
exports.default = Hello121113;