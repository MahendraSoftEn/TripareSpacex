import React from 'react';
import { StatusBar } from 'react-native';

import { RootNavigator } from '../navigation/RootNavigator';
import { AppProviders } from './providers/AppProviders';
import { appColors } from './theme/colors';

function App(): React.JSX.Element {
  return (
    <AppProviders>
      <StatusBar
        backgroundColor={appColors.background}
        barStyle="light-content"
      />
      <RootNavigator />
    </AppProviders>
  );
}

export default App;
