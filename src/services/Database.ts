import { Alert } from 'react-native';
import { enablePromise, openDatabase, SQLiteDatabase } from 'react-native-sqlite-storage';
import 'react-native-get-random-values';
import { nanoid } from 'nanoid';

// Define the data structures
export interface Client {
  id: string;
  name: string;
  companyName: string;
  phoneNumber: string;
}

export interface Deal {
  id: string;
  partyId: string;
  partyName?: string; // This will be added by the JOIN query
  date: string; // Storing date as ISO string (e.g., '2025-08-19T10:00:00.000Z')
  quality: string;
  quantity: number;
  unit: string;
  rate: number;
  notes: string;
}

enablePromise(true);
const DATABASE_NAME = 'CoreApp.db';

export const getDBConnection = async (): Promise<SQLiteDatabase> => {
  return openDatabase({ name: DATABASE_NAME, location: 'default' });
};

const createClientsTableQuery = `
  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    companyName TEXT,
    phoneNumber TEXT NOT NULL
  );
`;

const createDealsTableQuery = `
  CREATE TABLE IF NOT EXISTS deals (
    id TEXT PRIMARY KEY,
    partyId TEXT NOT NULL,
    date TEXT NOT NULL,
    quality TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    rate REAL NOT NULL,
    notes TEXT,
    FOREIGN KEY (partyId) REFERENCES clients (id)
  );
`;

export const initDB = async () => {
  const db = await getDBConnection();
  await db.executeSql(createClientsTableQuery);
  await db.executeSql(createDealsTableQuery);
  console.log('Database initialized.');
};

// --- Client Functions ---
export const getClients = async (): Promise<Client[]> => {
  const db = await getDBConnection();
  const results = await db.executeSql('SELECT * FROM clients ORDER BY name ASC');
  const clients: Client[] = [];
  results.forEach(result => {
    for (let i = 0; i < result.rows.length; i++) {
      clients.push(result.rows.item(i));
    }
  });
  return clients;
};

export const addClient = async (name: string, companyName: string, phoneNumber: string): Promise<Client> => {
  const db = await getDBConnection();
  const newClient: Client = { id: nanoid(), name, companyName, phoneNumber };
  const query = `INSERT INTO clients (id, name, companyName, phoneNumber) VALUES (?, ?, ?, ?);`;
  await db.executeSql(query, [newClient.id, newClient.name, newClient.companyName, newClient.phoneNumber]);
  return newClient;
};

// --- Deal Functions ---
export const getDeals = async (): Promise<Deal[]> => {
  const db = await getDBConnection();
  
  const query = `
    SELECT d.*, c.name as partyName 
    FROM deals d
    LEFT JOIN clients c ON d.partyId = c.id
    ORDER BY d.date DESC;
  `;
  const results = await db.executeSql(query);
  const deals: Deal[] = [];
  results.forEach(result => {
    for (let i = 0; i < result.rows.length; i++) {
      deals.push(result.rows.item(i));
    }
  });
  return deals;
};

export const getDealById = async (dealId: string): Promise<Deal | null> => {
    const db = await getDBConnection();
    const query = `
      SELECT d.*, c.name as partyName 
      FROM deals d
      LEFT JOIN clients c ON d.partyId = c.id
      WHERE d.id = ?;
    `;
    const results = await db.executeSql(query, [dealId]);
    if (results[0].rows.length > 0) {
      return results[0].rows.item(0);
    }
    return null;
};

export const addDeal = async (deal: Omit<Deal, 'id' | 'partyName'>): Promise<Deal> => {
  const db = await getDBConnection();
  const newDeal = { id: nanoid(), ...deal };
  const query = `INSERT INTO deals (id, partyId, date, quality, quantity, unit, rate, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`;
  await db.executeSql(query, [newDeal.id, newDeal.partyId, newDeal.date, newDeal.quality, newDeal.quantity, newDeal.unit, newDeal.rate, newDeal.notes]);
  return newDeal;
};

export const deleteDeal = async (dealId: string) => {
    const db = await getDBConnection();
    const query = `DELETE FROM deals WHERE id = ?;`;
    await db.executeSql(query, [dealId]);
    console.log(`Deal ${dealId} deleted.`);
};

// --- Backup Functions ---
export const clearAllData = async () => {
  const db = await getDBConnection();
  
  try {
    // Just delete all records - don't drop tables
    await db.transaction(async tx => {
      await tx.executeSql('DELETE FROM deals;');
      await tx.executeSql('DELETE FROM clients;');
    });
    
    console.log('All data cleared.');
  } catch (error) {
    console.error('Error in clearAllData:', error);
    // If tables don't exist, just ignore the error
    console.log('Tables may not exist yet, continuing...');
  }
};

export const batchInsertClients = async (clients: Client[]) => {
  const db = await getDBConnection();
  
  try {
    await db.transaction(async tx => {
      for (const client of clients) {
        // Use INSERT OR REPLACE to handle duplicates
        await tx.executeSql(
          'INSERT OR REPLACE INTO clients (id, name, companyName, phoneNumber) VALUES (?, ?, ?, ?);',
          [client.id, client.name, client.companyName, client.phoneNumber]
        );
      }
    });
    
    console.log(`Inserted ${clients.length} clients.`);
  } catch (error) {
    console.error('Error in batchInsertClients:', error);
    throw error;
  }
};

export const batchInsertDeals = async (deals: Deal[]) => {
  const db = await getDBConnection();
  
  try {
    // Insert each deal individually to avoid transaction rollback issues
    for (let i = 0; i < deals.length; i++) {
      const deal = deals[i];
      try {
        await db.executeSql(
          'INSERT OR REPLACE INTO deals (id, partyId, date, quality, quantity, unit, rate, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
          [deal.id, deal.partyId, deal.date, deal.quality, deal.quantity, deal.unit, deal.rate, deal.notes]
        );
      } catch (dealError) {
        console.error(`Failed to insert deal ${i + 1}:`, dealError);
        // Continue with next deal instead of stopping
      }
    }
    
    console.log(`Processed ${deals.length} deals.`);
  } catch (error) {
    console.error('Error in batchInsertDeals:', error);
    throw error;
  }
};