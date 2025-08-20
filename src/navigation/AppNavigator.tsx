// src/navigation/AppNavigator.tsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LedgerScreen from '../screens/LedgerScreen';
import NewDealScreen from '../screens/NewDealScreen';
import PartyListScreen from '../screens/PartyListScreen';
import DealDetailScreen from '../screens/DealDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';

export type MainStackParamList = {
  Ledger: { refresh?: boolean } | undefined; // UPDATE THIS LINE
  NewDeal: { selectedClientId?: string; selectedClientName?: string } | undefined;
  PartyList: undefined;
  DealDetail: { dealId: string };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<MainStackParamList>();

const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Ledger" id={undefined}>
      <Stack.Screen
        name="Ledger"
        component={LedgerScreen}
        options={{ title: 'Daily Ledger' }}
      />
      <Stack.Screen
        name="NewDeal"
        component={NewDealScreen}
        options={{ title: 'Add New Deal' }}
      />
      <Stack.Screen
        name="PartyList"
        component={PartyListScreen}
        options={{ title: 'Select a Client' }}
      />
      <Stack.Screen
        name="DealDetail"
        component={DealDetailScreen}
        options={{ title: 'Deal Details' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;