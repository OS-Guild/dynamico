import React from 'react';
import map from 'lodash/map';
import x from './yo';

const Testcomp = () => (
  <div>
    <span>
      Your aaaa aaacomponentasldjfhasdhfj{' '}
      {map([1, 2], i => (
        <span key={i}>{x.a + i}</span>
      ))}
    </span>
  </div>
);

export default Testcomp;

export const asfdf = {
  as: x
}

// export default Testcomp;