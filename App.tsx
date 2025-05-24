import React from 'react';
import Navigation from './Navigation';
import { UserProvider } from './userContext';

const App = () => {
  return (
    <UserProvider>
      <Navigation />
    </UserProvider>
  );
};

export default App;
