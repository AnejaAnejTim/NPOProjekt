import React, { useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { UserContext } from './userContext';

const Login = ({ navigation }) => {
  const isDarkMode = useColorScheme() === 'dark';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { user, setUser, refreshUser, loading } = useContext(UserContext)!;

  useEffect(() => {
    if (loading) {return;}

    if (user) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    }
  }, [user, loading, navigation]);

  const handleLogin = async () => {
    setError('');
    try {
      const res = await fetch('http://100.117.101.70:3001/users/appLogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.status === 200 && data.token && data.user) {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('userId', data.user.id || data.user._id || String(data.user.userId));
        console.log(data.user);
        setUser(data.user);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      } else {
        setError('Napačno uporabniško ime ali geslo');
      }
    } catch (err) {
      console.error(err);
      setError('Napaka pri prijavi');
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {backgroundColor: isDarkMode ? '#121212' : '#f9fafb'},
        ]}>
        <Text style={{color: isDarkMode ? 'white' : 'black'}}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: isDarkMode ? '#121212' : '#f9fafb'},
      ]}>
      <View
        style={[
          styles.card,
          {backgroundColor: isDarkMode ? '#333' : '#fff'},
          isDarkMode ? styles.shadowDark : styles.shadowLight,
        ]}>
        <Text style={[styles.title, {color: '#b0d16b'}]}>Prijava</Text>

        <TextInput
          placeholder="Uporabniško ime"
          placeholderTextColor={isDarkMode ? '#aaa' : '#666'}
          style={[
            styles.input,
            {
              color: isDarkMode ? 'white' : 'black',
              borderColor: isDarkMode ? '#555' : '#ccc',
            },
          ]}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <TextInput
          placeholder="Geslo"
          placeholderTextColor={isDarkMode ? '#aaa' : '#666'}
          style={[
            styles.input,
            {
              color: isDarkMode ? 'white' : 'black',
              borderColor: isDarkMode ? '#555' : '#ccc',
            },
          ]}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, !(username && password) && styles.disabled]}
          onPress={handleLogin}
          disabled={!(username && password)}>
          <Text style={styles.buttonText}>Prijava</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text
            style={[
              styles.registerLink,
              {color: isDarkMode ? '#66ccff' : '#003366'},
            ]}>
            Nimate računa? Registrirajte se tukaj
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: '5%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  shadowLight: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  shadowDark: {
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#b0d16b',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  disabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  registerLink: {
    fontSize: 14,
    textAlign: 'center',
  },
  error: {
    color: 'red',
    marginBottom: 12,
    textAlign: 'center',
  },
});
