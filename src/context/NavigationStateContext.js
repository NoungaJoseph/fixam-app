import React, { createContext, useContext, useState } from 'react';

const NavigationStateContext = createContext({
  currentRouteName: null,
  setCurrentRouteName: () => {},
});

export const NavigationStateProvider = ({ children }) => {
  const [currentRouteName, setCurrentRouteName] = useState(null);
  return (
    <NavigationStateContext.Provider value={{ currentRouteName, setCurrentRouteName }}>
      {children}
    </NavigationStateContext.Provider>
  );
};

export const useNavigationStateContext = () => useContext(NavigationStateContext);
