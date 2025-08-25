import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { AuthAPI } from '../api/client';
import { AvailabilityAPI } from '../api/client';
import { BASE_URL } from '../api/client';

export default function ProfileScreen() {
  const { signOut, token } = useContext(AuthContext);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pingMsg, setPingMsg] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await AuthAPI.me(token);
        if (mounted) setMe(data);
      } catch (e) {
        if (mounted) setError(e.message || 'Failed to load');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [token]);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      {loading ? (
        <ActivityIndicator />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : me ? (
        <View style={styles.card}>
          <Text style={styles.row}><Text style={styles.label}>Username:</Text> {me.username}</Text>
          <Text style={styles.row}><Text style={styles.label}>Email:</Text> {me.email}</Text>
          <Text style={styles.row}><Text style={styles.label}>ID:</Text> {me.id}</Text>
        </View>
      ) : (
        <Text style={styles.subtitle}>Account and preferences.</Text>
      )}
      <View style={{ height: 16 }} />
      <Button
        title="Ping API"
        onPress={async () => {
          try {
            setPingMsg('');
            const res = await fetch(`${BASE_URL}/api/ping`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setPingMsg(`ok=${data.ok} time=${data.time}`);
          } catch (e) {
            setPingMsg(`error: ${e.message}`);
          }
        }}
      />
      {pingMsg ? <Text style={styles.subtitle}>{pingMsg}</Text> : null}
      <Button title="Sign Out" onPress={signOut} color="#d00" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 8 },
  subtitle: { color: '#666' },
  error: { color: '#d00' },
  card: { padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, width: '100%', maxWidth: 420, marginTop: 8 },
  row: { marginBottom: 6 },
  label: { fontWeight: '600' },
});
