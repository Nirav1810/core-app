import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { getClients, getDeals, clearAllData, batchInsertClients, batchInsertDeals, Client, Deal } from './Database';
import { format } from 'date-fns';
import { Platform } from 'react-native';

// --- THIS FUNCTION IS NOW FIXED ---
export const exportData = async () => {
  const clients = await getClients();
  const deals = await getDeals();

  if (clients.length === 0 && deals.length === 0) {
    throw new Error('There is no data to export.');
  }

  const backupData = {
    exportDate: new Date().toISOString(),
    clients,
    deals,
  };

  const jsonString = JSON.stringify(backupData, null, 2);
  const dateSuffix = format(new Date(), 'yyyyMMdd_HHmmss');
  
  // Create a path in the app's temporary cache directory
  const path = `${RNFS.CachesDirectoryPath}/coreapp_backup_${dateSuffix}.json`;

  // 1. Write the backup data to the temporary file
  await RNFS.writeFile(path, jsonString, 'utf8');

  // 2. Share the path to the newly created file
  await Share.open({
    title: 'Export Core App Data',
    url: 'file://' + path,
    type: 'application/json',
    subject: 'Core App Data Backup',
    failOnCancel: false, // Prevents an error from being thrown if the user cancels
  });
};

// The importDataFromFile function with improved error handling
export const importDataFromFile = async (fileUri: string): Promise<string> => {
  try {
    const decodedUri = decodeURIComponent(fileUri);
    const path = Platform.OS === 'android' && decodedUri.startsWith('content://') 
      ? decodedUri 
      : decodedUri.replace('file://', '');

    console.log('Reading file from path:', path);
    const jsonString = await RNFS.readFile(path, 'utf8');
    const data = JSON.parse(jsonString);

    if (!data.clients || !data.deals) {
      throw new Error('This does not appear to be a valid backup file.');
    }

    console.log(`Found ${data.clients.length} clients and ${data.deals.length} deals to import`);

    // Clear existing data first (but keep tables)
    console.log('Clearing existing data...');
    await clearAllData();
    
    console.log('Importing clients...');
    await batchInsertClients(data.clients);
    
    console.log('Importing deals...');
    await batchInsertDeals(data.deals);

    return `Import successful. Restored ${data.clients.length} clients and ${data.deals.length} deals.`;
  } catch (err: any) {
    console.error("Import Error:", err);
    throw new Error(`Failed to import backup file: ${err.message}`);
  }
};