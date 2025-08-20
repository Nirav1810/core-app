// src/App.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Linking, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from '@ant-design/react-native';
import enUS from '@ant-design/react-native/lib/locale-provider/en_US';

import PinScreen from './src/screens/PinScreen';
import AppNavigator from './src/navigation/AppNavigator';
import { initDB } from './src/services/Database';
import { importDataFromFile } from './src/services/BackupService';

const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" />
    <Text style={{ marginTop: 10 }}>Initializing App...</Text>
  </View>
);

const App = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isDbInitialized, setIsDbInitialized] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Add this to force refresh

  useEffect(() => {
    const initialize = async () => {
      try {
        await initDB();
        setIsDbInitialized(true);
      } catch (error) {
        console.error("Failed to initialize database:", error);
      }
    };
    
    initialize();

    // --- NEW LOGIC TO HANDLE OPENING FILES ---
    const handleFileImport = async (url: string | null) => {
      if (!url) return;

      Alert.alert(
        'Import Backup?',
        'A backup file was opened. Do you want to restore from this backup? This will overwrite all current data.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: async () => {
              try {
                // We need to decode the URL to get a clean file path
                const decodedUrl = decodeURIComponent(url);
                const result = await importDataFromFile(decodedUrl);
                Alert.alert('Success', result);
                // Force app to refresh after successful import
                setRefreshKey(prev => prev + 1);
              } catch (error: any) {
                Alert.alert('Import Failed', error.message);
              }
            },
          },
        ]
      );
    };
    
    // Check if the app was launched by opening a file
    Linking.getInitialURL().then(handleFileImport);

    // Add a listener for files opened while the app is already running
    const subscription = Linking.addEventListener('url', event => handleFileImport(event.url));
    
    // Clean up the listener when the app closes
    return () => subscription.remove();
  }, []);

  const renderContent = () => {
    if (!isDbInitialized) {
      return <LoadingScreen />;
    }

    if (!isUnlocked) {
      return <PinScreen onSuccess={() => setIsUnlocked(true)} />;
    }

    return (
      <NavigationContainer key={refreshKey}>
        <AppNavigator />
      </NavigationContainer>
    );
  };

  return (
    <Provider locale={enUS}>
      {renderContent()}
    </Provider>
  );
};

export default App;