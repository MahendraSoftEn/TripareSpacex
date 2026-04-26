import React, { PropsWithChildren } from 'react';
import renderer, { ReactTestRenderer } from 'react-test-renderer';

import { AppProviders } from '../app/providers/AppProviders';

function TestProviders({ children }: PropsWithChildren): React.JSX.Element {
  return <AppProviders>{children}</AppProviders>;
}

export function renderWithProviders(
  ui: React.ReactElement,
): ReactTestRenderer {
  return renderer.create(<TestProviders>{ui}</TestProviders>);
}
