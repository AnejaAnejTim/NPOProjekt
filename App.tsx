import React, { useEffect, useState } from 'react';
import GetLocation from 'react-native-get-location';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import {
  Colors,
} from 'react-native/Libraries/NewAppScreen';

const App = (): React.JSX.Element => {
  const isDarkMode = useColorScheme() === 'dark';
   const [location, setLocation] = useState<null | {
      latitude: number;
      longitude: number;
    }>(null);


  useEffect(() => {
    GetLocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 60000,
    })
      .then(location => {
        setLocation({
                 latitude: location.latitude,
                 longitude: location.longitude,
               });
      })
      .catch(error => {
        const { code, message } = error;
        console.warn('Location error:', code, message);
      });
  }, []);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    padding: '5%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  };

  return (
    <View style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />

    <Text style={{ color: isDarkMode ? 'white' : 'black', fontSize: 18 }}>
            {location
              ? `Latitude: ${location.latitude}\nLongitude: ${location.longitude}`
              : 'Fetching your location...'}
          </Text>


    </View>
  );
};

export default App;
