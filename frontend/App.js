import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from './src/screens/HomeScreen';
import FriendsScreen from './src/screens/FriendsScreen';
import GroupsScreen from './src/screens/GroupsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AuthScreen from './src/screens/AuthScreen';
import { AuthContext } from './src/context/AuthContext';


const Tab = createBottomTabNavigator();

export default function App() {
  const [token, setToken] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem('authToken');
        if (t) setToken(t);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  const signOut = async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('currentUser');
    setToken(null);
  };

  return (
    <SafeAreaProvider>
      <AuthContext.Provider value={{ token, setToken, signOut }}>
        <NavigationContainer>
          <StatusBar style="auto" />
          {booting ? null : token ? (
            <Tab.Navigator screenOptions={{ headerShown: true }}>
              <Tab.Screen name="Home" component={HomeScreen} />
              <Tab.Screen name="Friends" component={FriendsScreen} />
              <Tab.Screen name="Groups" component={GroupsScreen} />
              <Tab.Screen name="Profile" component={ProfileScreen} />
            </Tab.Navigator>
          ) : (
            <AuthScreen onAuthed={(t) => setToken(t)} />
          )}
        </NavigationContainer>
      </AuthContext.Provider>
    </SafeAreaProvider>
  );
}
