const code = `
const React = require('react');

const ReactDOM = require('react-dom');

class Hello extends React.Component {

  render() {
    return React.createElement('div', null, this.props.test, this.props.children);
  }

}

exports.default = Hello;
`

module.exports = (req, res, next) => {  
  res.status(200).send(code)
}