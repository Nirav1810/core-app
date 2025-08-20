// src/screens/SettingsScreen.tsx

import React, { useState } from 'react';
import { StyleSheet, View, Alert, Modal as RNModal, ActivityIndicator, Text } from 'react-native';
import { List, Button, WingBlank, WhiteSpace } from '@ant-design/react-native';
import { exportData } from '../services/BackupService'; // We use exportData (file-based) now
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/AppNavigator';

type SettingsScreenProps = NativeStackScreenProps<MainStackParamList, 'Settings'>;

const SettingsScreen = ({ navigation }: SettingsScreenProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);
    try {
      // This function now uses react-native-share to export a file
      await exportData();
    } catch (error: any) {
      // Ignore cancellation errors from the share sheet
      if (!error.message.includes('User did not share')) {
         Alert.alert('Export Failed', error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // The import button now just shows instructions
  const handleImport = () => {
    Alert.alert(
      'How to Import Data',
      '1. Find your `coreapp_backup.json` file in your phone\'s file manager or email app.\n\n2. Tap on the file.\n\n3. Choose to open it with the Core App.\n\nThe app will then ask to restore your data.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <RNModal visible={isLoading} transparent>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      </RNModal>

      <WingBlank>
        <WhiteSpace size="xl" />
        <List renderHeader="Backup & Restore (via File)">
          <List.Item>
            <Button type="primary" onPress={handleExport} disabled={isLoading}>
              Export Data to File
            </Button>
          </List.Item>
          <List.Item>
            <Button type="warning" onPress={handleImport} disabled={isLoading}>
              How to Import Data
            </Button>
          </List.Item>
          <List.Item.Brief style={styles.infoText}>
            Exporting creates a backup file you can save to your email or cloud drive. To import, simply open that file with this app.
          </List.Item.Brief>
        </List>
      </WingBlank>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f9' },
  infoText: { padding: 15, textAlign: 'center' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  loadingText: {
    marginTop: 10,
    color: 'white',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
});

export default SettingsScreen;