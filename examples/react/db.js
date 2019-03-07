const code = `
const React = require('react');

const ReactDOM = require('react-dom');

class Hello extends React.Component {

  render() {
    return React.createElement('div', null, 'syp');
  }

}

exports.default = Hello;
`

module.exports = (req, res, next) => {
    console.log(req.body)
    res.status(200).send(code)
  }