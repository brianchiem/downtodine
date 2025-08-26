import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { GroupsAPI } from '../api/client';

export default function GroupsScreen() {
  const { token } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [name, setName] = useState('');
  const [joinId, setJoinId] = useState('');
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [detail, setDetail] = useState({}); // id -> detail

  const load = async () => {
    try {
      setLoading(true);
      const res = await GroupsAPI.list(token);
      setGroups(res.groups || []);
    } catch (e) {
      setError(e.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const createGroup = async () => {
    if (!name.trim()) return;
    try {
      setCreating(true);
      setError('');
      await GroupsAPI.create(token, name.trim());
      setName('');
      await load();
    } catch (e) {
      setError(e.message || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const joinGroup = async () => {
    if (!joinId.trim()) return;
    try {
      setJoining(true);
      setError('');
      await GroupsAPI.join(token, joinId.trim());
      setJoinId('');
      await load();
    } catch (e) {
      setError(e.message || 'Failed to join group');
    } finally {
      setJoining(false);
    }
  };

  const leaveGroup = async (id) => {
    try {
      await GroupsAPI.leave(token, id);
      await load();
    } catch (e) {
      setError(e.message || 'Failed to leave group');
    }
  };

  const toggleDetail = async (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!detail[id]) {
      try {
        const d = await GroupsAPI.detail(token, id);
        setDetail((prev) => ({ ...prev, [id]: d }));
      } catch (e) {
        // ignore but show minimal state
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Groups MVP UI: list groups, create group, join by id, leave, view detail</Text>
        {!!error && <Text style={styles.error}>{error}</Text>}
      </View>

      <View style={styles.formRow}>
        <TextInput
          placeholder="New group name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <TouchableOpacity onPress={createGroup} disabled={creating || !name.trim()} style={[styles.primaryBtn, (creating || !name.trim()) && styles.btnDisabled]}>
          <Text style={styles.primaryText}>{creating ? 'Creating…' : 'Create'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formRow}>
        <TextInput
          placeholder="Join by ID"
          value={joinId}
          onChangeText={setJoinId}
          style={styles.input}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={joinGroup} disabled={joining || !joinId.trim()} style={[styles.secondaryBtn, (joining || !joinId.trim()) && styles.btnDisabled]}>
          <Text style={styles.secondaryText}>{joining ? 'Joining…' : 'Join'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 16 }} />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(g) => g.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <View style={styles.groupBlock}>
              <TouchableOpacity style={styles.groupRow} onPress={() => toggleDetail(item.id)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.groupName}>{item.name}</Text>
                  <Text style={styles.groupMeta}>{item.membersCount} members</Text>
                </View>
                <TouchableOpacity style={styles.leaveBtn} onPress={() => leaveGroup(item.id)}>
                  <Text style={styles.leaveText}>Leave</Text>
                </TouchableOpacity>
              </TouchableOpacity>
              {expandedId === item.id && (
                <View style={styles.detailBox}>
                  {detail[item.id] ? (
                    <>
                      <Text style={styles.sectionTitle}>Members</Text>
                      {(detail[item.id].members || []).map((m) => (
                        <Text key={m.id} style={styles.memberRow}>• {m.username} ({m.email})</Text>
                      ))}
                    </>
                  ) : (
                    <ActivityIndicator />
                  )}
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={<Text style={styles.subtitle}>No groups yet</Text>}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { paddingHorizontal: 16, paddingTop: 12 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: '#666', marginTop: 8, paddingHorizontal: 16 },
  error: { color: '#d00', marginBottom: 8 },
  formRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 },
  input: { flex: 1, height: 40, borderWidth: StyleSheet.hairlineWidth, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#fafafa' },
  primaryBtn: { marginLeft: 8, backgroundColor: '#0a84ff', paddingHorizontal: 14, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: 'white', fontWeight: '600' },
  secondaryBtn: { marginLeft: 8, backgroundColor: '#f0f0f0', paddingHorizontal: 14, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: '#333', fontWeight: '600' },
  btnDisabled: { opacity: 0.6 },
  groupBlock: { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#eee' },
  groupRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  groupName: { fontSize: 16, fontWeight: '600' },
  groupMeta: { color: '#666' },
  leaveBtn: { backgroundColor: '#ffdada', paddingHorizontal: 12, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  leaveText: { color: '#b00020', fontWeight: '600' },
  detailBox: { paddingHorizontal: 16, paddingBottom: 12 },
  sectionTitle: { fontWeight: '700', marginBottom: 6, marginTop: 4 },
  memberRow: { color: '#333', marginBottom: 2 },
});
