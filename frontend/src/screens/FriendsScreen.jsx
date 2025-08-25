import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { FriendsAPI, AvailabilityAPI, FriendRequestsAPI } from '../api/client';

export default function FriendsScreen() {
  const { token } = useContext(AuthContext);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [details, setDetails] = useState({}); // id -> { loading, error, hours, overlap }
  const [reqsLoading, setReqsLoading] = useState(true);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);

  const load = async () => {
    try {
      setError('');
      setLoading(true);
      const res = await FriendsAPI.list(token);
      setFriends(Array.isArray(res.friends) ? res.friends : []);
    } catch (e) {
      setError(e.message || 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  const toggleDetail = async (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    // fetch if not present
    if (!details[id]) {
      setDetails((d) => ({ ...d, [id]: { loading: true } }));
      try {
        const res = await AvailabilityAPI.getUserToday(token, id);
        setDetails((d) => ({ ...d, [id]: { loading: false, error: '', hours: res.hours || [], overlap: res.overlap || [] } }));
      } catch (e) {
        setDetails((d) => ({ ...d, [id]: { loading: false, error: e.message || 'Failed to load' } }));
      }
    }
  };

  useEffect(() => {
    load();
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const loadRequests = async () => {
    try {
      setReqsLoading(true);
      const res = await FriendRequestsAPI.list(token);
      setIncoming(Array.isArray(res.incoming) ? res.incoming : []);
      setOutgoing(Array.isArray(res.outgoing) ? res.outgoing : []);
    } catch (e) {
      // don't override global error; keep requests local
      console.warn('Failed to load friend requests', e);
    } finally {
      setReqsLoading(false);
    }
  };

  const sendRequest = async () => {
    if (!username.trim()) return;
    try {
      setAdding(true);
      setError('');
      await FriendRequestsAPI.send(token, username.trim());
      setUsername('');
      await loadRequests();
    } catch (e) {
      setError(e.message || 'Failed to send request');
    } finally {
      setAdding(false);
    }
  };

  const acceptRequest = async (requestId) => {
    try {
      await FriendRequestsAPI.accept(token, requestId);
      await Promise.all([loadRequests(), load()]);
    } catch (e) {
      setError(e.message || 'Failed to accept');
    }
  };

  const declineRequest = async (requestId) => {
    try {
      await FriendRequestsAPI.decline(token, requestId);
      await loadRequests();
    } catch (e) {
      setError(e.message || 'Failed to decline');
    }
  };

  const removeFriend = async (id) => {
    try {
      setRemovingId(id);
      setError('');
      const res = await FriendsAPI.remove(token, id);
      setFriends(Array.isArray(res.friends) ? res.friends : []);
    } catch (e) {
      setError(e.message || 'Failed to remove friend');
    } finally {
      setRemovingId(null);
    }
  };

  const renderItem = ({ item }) => {
    const det = details[item.id];
    const isOpen = expandedId === item.id;
    return (
      <View style={styles.friendBlock}>
        <TouchableOpacity style={styles.friendItem} onPress={() => toggleDetail(item.id)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.friendName}>{item.username}</Text>
            <Text style={styles.friendEmail}>{item.email}</Text>
          </View>
          <Text style={styles.expandHint}>{isOpen ? 'Hide' : 'View'}</Text>
        </TouchableOpacity>
        {isOpen && (
          <View style={styles.detailBox}>
            {det?.loading ? (
              <ActivityIndicator />
            ) : det?.error ? (
              <Text style={styles.error}>{det.error}</Text>
            ) : (
              <>
                <Text style={styles.detailTitle}>Today</Text>
                <Text style={styles.detailLabel}>Hours:</Text>
                <View style={styles.chipRow}>
                  {(det?.hours || []).length === 0 ? (
                    <Text style={styles.subtitle}>No hours selected</Text>
                  ) : (
                    det.hours.map((h) => (
                      <View key={h} style={[styles.chip, (det.overlap || []).includes(h) ? styles.chipOverlap : styles.chipNeutral]}>
                        <Text style={styles.chipText}>{`${h}:00`}</Text>
                      </View>
                    ))
                  )}
                </View>
                <Text style={styles.detailLabel}>Overlap: {(det?.overlap || []).length}</Text>
              </>
            )}
            <View style={{ height: 8 }} />
            <TouchableOpacity
              onPress={() => removeFriend(item.id)}
              style={[styles.removeBtn, removingId === item.id && styles.btnDisabled]}
              disabled={removingId === item.id}
            >
              <Text style={styles.removeText}>{removingId === item.id ? 'Removing…' : 'Remove friend'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Friends</Text>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <>
          <View style={styles.addRow}>
            <TextInput
              placeholder="Add by username"
              value={username}
              onChangeText={setUsername}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={sendRequest} style={[styles.addBtn, (adding || !username.trim()) && styles.btnDisabled]} disabled={adding || !username.trim()}>
              <Text style={styles.addText}>{adding ? 'Sending…' : 'Send'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requests</Text>
            {reqsLoading ? (
              <ActivityIndicator />
            ) : (
              <>
                <Text style={styles.subsectionTitle}>Incoming</Text>
                {incoming.length === 0 ? (
                  <Text style={styles.subtitle}>No incoming requests</Text>
                ) : (
                  incoming.map((r) => (
                    <View key={r.id} style={styles.requestItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.friendName}>{r.from.username}</Text>
                        <Text style={styles.friendEmail}>{r.from.email}</Text>
                      </View>
                      <TouchableOpacity style={styles.acceptBtn} onPress={() => acceptRequest(r.id)}>
                        <Text style={styles.acceptText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.declineBtn} onPress={() => declineRequest(r.id)}>
                        <Text style={styles.declineText}>Decline</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
                <Text style={styles.subsectionTitle}>Outgoing</Text>
                {outgoing.length === 0 ? (
                  <Text style={styles.subtitle}>No outgoing requests</Text>
                ) : (
                  outgoing.map((r) => (
                    <View key={r.id} style={styles.requestItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.friendName}>{r.to.username}</Text>
                        <Text style={styles.friendEmail}>{r.to.email}</Text>
                      </View>
                      <Text style={styles.pendingText}>Pending</Text>
                    </View>
                  ))
                )}
              </>
            )}
          </View>

          <Text style={styles.count}>{friends.length} {friends.length === 1 ? 'friend' : 'friends'}</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <FlatList
            data={friends}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            style={{ alignSelf: 'stretch' }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={<Text style={styles.subtitle}>No friends yet. Add someone by username.</Text>}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 24, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 12 },
  addRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8, alignSelf: 'stretch' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 10, height: 40, backgroundColor: 'white' },
  addBtn: { marginLeft: 8, backgroundColor: '#0a84ff', paddingHorizontal: 14, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  addText: { color: 'white', fontWeight: '600' },
  btnDisabled: { opacity: 0.6 },
  count: { alignSelf: 'flex-start', paddingHorizontal: 16, color: '#666', marginBottom: 8 },
  friendBlock: { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e0e0e0' },
  friendItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  friendName: { fontWeight: '600' },
  friendEmail: { color: '#666', fontSize: 12 },
  expandHint: { color: '#0a84ff', fontWeight: '600' },
  detailBox: { backgroundColor: '#fafafa', borderWidth: StyleSheet.hairlineWidth, borderColor: '#eee', borderRadius: 8, padding: 12, marginBottom: 10 },
  detailTitle: { fontWeight: '700', marginBottom: 6 },
  detailLabel: { color: '#555', marginTop: 4, marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12, marginRight: 6, marginBottom: 6, borderWidth: 1 },
  chipNeutral: { backgroundColor: '#f5f5f5', borderColor: '#ddd' },
  chipOverlap: { backgroundColor: '#0a84ff22', borderColor: '#0a84ff' },
  chipText: { color: '#333', fontSize: 12 },
  removeBtn: { backgroundColor: '#eee', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  removeText: { fontWeight: '600', color: '#333' },
  error: { color: '#d00', marginBottom: 8, marginLeft: 16, alignSelf: 'flex-start' },
  subtitle: { color: '#666', paddingHorizontal: 16, marginTop: 8 },
});
