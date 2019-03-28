'use strict';
function _interopDefault(e) {
  return e && 'object' == typeof e && 'default' in e ? e.default : e;
}
var React = _interopDefault(require('react')),
  name = 'Mycomp',
  version = '1.0.1',
  hostVersion = '1.2.0',
  main = './index.tsx',
  devDependencies = {
    '@types/react': '^16.8.3',
    '@types/react-dom': '^16.8.3',
    react: '^16.8.3',
    'react-dom': '^16.8.3',
    'ts-node': '^8.0.3',
    tslib: '^1.9.3',
    typescript: '^3.3.4000'
  },
  peerDependencies = { react: '^16.8.3', 'react-dom': '^16.8.3' },
  pkg = {
    name: name,
    version: version,
    hostVersion: hostVersion,
    main: main,
    devDependencies: devDependencies,
    peerDependencies: peerDependencies
  },
  Mycomp = function(e) {
    var n = e.username;
    return React.createElement(
      'div',
      null,
      React.createElement('span', null, 'Hello ', n, ', this is your ', pkg.name, ' component'),
      React.createElement('div', null, React.createElement('span', null, 'Host version ', pkg.hostVersion)),
      React.createElement('div', null, React.createElement('span', null, 'Component version ', pkg.version)),
      React.createElement(
        'div',
        null,
        React.createElement(
          'button',
          {
            onClick: function() {
              alert('Button clicked');
            }
          },
          'Click!'
        )
      )
    );
  };
module.exports = Mycomp;
//# sourceMappingURL=index.js.map
