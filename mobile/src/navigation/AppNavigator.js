import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import SetupOTPScreen from '../screens/SetupOTPScreen';
import VerifyOTPScreen from '../screens/VerifyOTPScreen';
import DashboardScreen from '../screens/DashboardScreen';

const Stack = createStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: '#16213e' },
  headerTintColor: '#ffffff',
  headerTitleStyle: { fontWeight: 'bold' },
  cardStyle: { backgroundColor: '#1a1a2e' }
};

export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('token').then(token => {
      setUserToken(token);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' }}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={screenOptions} initialRouteName={userToken ? 'Dashboard' : 'Login'}>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Créer un compte' }} />
      <Stack.Screen name="SetupOTP" component={SetupOTPScreen} options={{ title: 'Configurer OTP' }} />
      <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} options={{ title: 'Vérification OTP' }} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
