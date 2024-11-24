import * as React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

export const AlarmIcon = (props) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
    <Circle cx={12} cy={12} r={9} stroke="currentColor" strokeWidth={2} />
    <Path
      d="M12 7v5l3 3"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

// Add more icons as needed 