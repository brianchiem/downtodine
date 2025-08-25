import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthAPI } from '../api/client';

export default function AuthScreen({ onAuthed }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (mode === 'register') {
        if (!username || !email || !password) {
          Alert.alert('Missing fields', 'Please fill username, email, and password.');
          return;
        }
        const { token, user } = await AuthAPI.register({ username, email, password });
        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('currentUser', JSON.stringify(user));
        onAuthed?.(token, user);
      } else {
        if (!emailOrUsername || !password) {
          Alert.alert('Missing fields', 'Please fill email/username and password.');
          return;
        }
        const { token, user } = await AuthAPI.login({ emailOrUsername, password });
        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('currentUser', JSON.stringify(user));
        onAuthed?.(token, user);
      }
    } catch (e) {
      Alert.alert('Auth error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Down to Dine</Text>
      <View style={styles.switchRow}>
        <Button title="Login" onPress={() => setMode('login')} color={mode === 'login' ? '#007aff' : '#999'} />
        <Button title="Register" onPress={() => setMode('register')} color={mode === 'register' ? '#007aff' : '#999'} />
      </View>

      {mode === 'register' ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Username"
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </>
      ) : (
        <TextInput
          style={styles.input}
          placeholder="Email or Username"
          autoCapitalize="none"
          value={emailOrUsername}
          onChangeText={setEmailOrUsername}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button title={loading ? 'Please wait…' : mode === 'register' ? 'Create Account' : 'Login'} onPress={handleSubmit} disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
});
