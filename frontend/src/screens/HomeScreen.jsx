import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { AvailabilityAPI } from '../api/client';

export default function HomeScreen() {
  const { token } = useContext(AuthContext);
  const [date, setDate] = useState('');
  const [hours, setHours] = useState([]); // working copy (local)
  const [serverHours, setServerHours] = useState([]); // last loaded from server
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const dirty = JSON.stringify(hours) !== JSON.stringify(serverHours);
  const [saved, setSaved] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [friends, setFriends] = useState([]); // { userId, username, hours, overlap, overlapCount }

  async function load() {
    try {
      setError('');
      setLoading(true);
      const data = await AvailabilityAPI.getToday(token);
      setDate(data.date);
      const loaded = Array.isArray(data.hours) ? data.hours : [];
      setServerHours(loaded);
      setHours(loaded);
      // Also load friends overlaps
      const f = await AvailabilityAPI.getFriendsToday(token);
      setFriends(Array.isArray(f.friends) ? f.friends : []);
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const persistHours = async () => {
    setSaving(true);
    setError('');
    try {
      const resp = await AvailabilityAPI.setTodayHours(token, hours);
      const next = Array.isArray(resp.hours) ? resp.hours : hours;
      setServerHours(next);
      setHours(next);
      // Refresh friends based on new myHours
      const f = await AvailabilityAPI.getFriendsToday(token);
      setFriends(Array.isArray(f.friends) ? f.friends : []);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      setError(e.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const toggleHour = async (h) => {
    const set = new Set(hours);
    if (set.has(h)) set.delete(h);
    else set.add(h);
    const next = Array.from(set).sort((a, b) => a - b);
    setHours(next);
  };

  const lunchRange = [10, 11, 12, 13, 14, 15];
  const dinnerRange = [16, 17, 18, 19, 20, 21];
  const setLunch = () => {
    const merged = Array.from(new Set([...(hours || []), ...lunchRange])).sort((a, b) => a - b);
    setHours(merged);
  };
  const setDinner = () => {
    const merged = Array.from(new Set([...(hours || []), ...dinnerRange])).sort((a, b) => a - b);
    setHours(merged);
  };
  const clearAll = () => setHours([]);
  const selectBoth = () => setHours(Array.from(new Set([...(hours || []), ...lunchRange, ...dinnerRange])).sort((a, b) => a - b));

  const HourChip = ({ h }) => {
    const selected = hours.includes(h);
    return (
      <TouchableOpacity
        onPress={() => toggleHour(h)}
        disabled={saving}
        style={[styles.chip, selected ? styles.chipSelected : styles.chipUnselected]}
      >
        <Text style={selected ? styles.chipTextSelected : styles.chipText}>{`${h}:00`}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Today</Text>
        {dirty ? <View style={styles.dot} /> : null}
      </View>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <ScrollView
          style={{ alignSelf: 'stretch' }}
          contentContainerStyle={{ alignItems: 'center' }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Text style={styles.subtitle}>UTC Date: {date || '-'}</Text>
          <Text style={styles.count}>Selected: {hours.length} {hours.length === 1 ? 'hour' : 'hours'}</Text>
          <View style={{ height: 16 }} />
          <Text style={styles.sectionTitle}>Lunch (10-15)</Text>
          <View style={styles.chipRow}>
            {lunchRange.map((h) => (
              <HourChip key={h} h={h} />
            ))}
          </View>
          <View style={{ height: 12 }} />
          <Text style={styles.sectionTitle}>Dinner (16-21)</Text>
          <View style={styles.chipRow}>
            {dinnerRange.map((h) => (
              <HourChip key={h} h={h} />
            ))}
          </View>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={setLunch} disabled={saving}>
              <Text style={styles.actionText}>Select Lunch</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={setDinner} disabled={saving}>
              <Text style={styles.actionText}>Select Dinner</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={selectBoth} disabled={saving}>
              <Text style={styles.actionText}>Select Both</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={clearAll} disabled={saving}>
              <Text style={styles.actionText}>Clear</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.primaryBtn, (!dirty || saving) && styles.btnDisabled]}
              onPress={persistHours}
              disabled={!dirty || saving}
            >
              <Text style={styles.primaryText}>{saving ? 'Saving…' : 'Update'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryBtn, (!dirty || saving) && styles.btnDisabled]}
              onPress={() => setHours(serverHours)}
              disabled={!dirty || saving}
            >
              <Text style={styles.secondaryText}>Revert</Text>
            </TouchableOpacity>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {saved ? <Text style={styles.saved}>Saved</Text> : null}

          <View style={{ height: 16 }} />
          <Text style={styles.sectionTitle}>Friends down today</Text>
          {friends.length === 0 ? (
            <Text style={styles.subtitle}>No friends available today or no friends added.</Text>
          ) : (
            <View style={styles.friendList}>
              {friends.map((fr) => (
                <View key={fr.userId} style={styles.friendItem}>
                  <Text style={styles.friendName}>{fr.username}</Text>
                  <Text style={styles.friendMeta}>
                    Overlap: {fr.overlapCount} {fr.overlapCount === 1 ? 'hour' : 'hours'}
                    {fr.overlapCount > 0 ? ` (${fr.overlap.join(', ')})` : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '600', marginRight: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ff9f0a' },
  subtitle: { color: '#666' },
  sectionTitle: { fontWeight: '600', marginBottom: 6 },
  count: { color: '#333', marginTop: 4 },
  error: { color: '#d00', marginTop: 8 },
  saved: { color: '#0a8', marginTop: 8, fontWeight: '600' },
  friendList: { alignSelf: 'stretch', paddingHorizontal: 16, marginTop: 8 },
  friendItem: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e0e0e0' },
  friendName: { fontWeight: '600' },
  friendMeta: { color: '#555', marginTop: 2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  chip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, margin: 4, borderWidth: 1 },
  chipSelected: { backgroundColor: '#0a84ff22', borderColor: '#0a84ff' },
  chipUnselected: { backgroundColor: '#f5f5f5', borderColor: '#ddd' },
  chipText: { color: '#333' },
  chipTextSelected: { color: '#0a84ff', fontWeight: '600' },
  actionsRow: { flexDirection: 'row', marginTop: 12 },
  actionBtn: { backgroundColor: '#eee', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, marginHorizontal: 4 },
  actionText: { fontWeight: '600' },
  primaryBtn: { backgroundColor: '#0a84ff', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, marginHorizontal: 4 },
  primaryText: { color: 'white', fontWeight: '600' },
  secondaryBtn: { backgroundColor: '#f0f0f0', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, marginHorizontal: 4 },
  secondaryText: { color: '#333', fontWeight: '600' },
  btnDisabled: { opacity: 0.6 },
});
