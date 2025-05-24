import React, { useEffect, useContext } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { UserContext } from './userContext';

const AuthScreen = ({ navigation }) => {
  const context = useContext(UserContext);

  useEffect(() => {
    const bootstrap = async () => {
      if (!context) return;

      const { refreshUser, user } = context;

      await refreshUser();

      if (context.user) {
        navigation.replace('Home');
      } else {
        navigation.replace('Login');
      }
    };

    bootstrap();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#b0d16b" />
    </View>
  );
};

export default AuthScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
