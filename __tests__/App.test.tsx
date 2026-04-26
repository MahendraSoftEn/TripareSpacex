import React from 'react';
import renderer, { act } from 'react-test-renderer';

import App from '../App';

jest.mock('../src/navigation/RootNavigator', () => ({
  RootNavigator: () => {
    const { Text } = require('react-native');

    return <Text>Mission Control</Text>;
  },
}));

describe('App', () => {
  it('renders without crashing', async () => {
    await act(async () => {
      renderer.create(<App />);
    });
  });
});
