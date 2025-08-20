import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, Alert, PermissionsAndroid, Platform, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { List, Button, WhiteSpace, Modal, InputItem, ActivityIndicator } from '@ant-design/react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/types';
import { getClients, addClient, Client } from '../services/Database';
import Contacts from 'react-native-contacts';

type PartyListProps = NativeStackScreenProps<MainStackParamList, 'PartyList'>;

const PartyListScreen = ({ navigation }: PartyListProps) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isAddModalVisible, setAddModalVisible] = useState<boolean>(false);
  const [isImportModalVisible, setImportModalVisible] = useState<boolean>(false);
  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState('');

  // (All other functions like loadClients, handleSaveClient, etc., remain the same)
  const [name, setName] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');

  const loadClients = async () => {
    const savedClients = await getClients();
    setClients(savedClients);
  };

  useFocusEffect(useCallback(() => { loadClients(); }, []));

  const handleModalClose = () => {
    setAddModalVisible(false);
    setName('');
    setCompanyName('');
    setPhoneNumber('');
  };

  const handleSaveClient = async () => {
    const trimmedName = name.trim();
    const trimmedPhone = phoneNumber.trim();

    if (!trimmedName || !trimmedPhone) {
      Alert.alert('Validation Error', 'Name and Phone Number are required.');
      return;
    }
    
    await addClient(trimmedName, companyName.trim(), trimmedPhone);
    handleModalClose();
    loadClients();
  };

  const handleImportContacts = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Permission Denied', 'Cannot access contacts.');
        return;
      }
    }
    
    setIsLoadingContacts(true);
    setImportModalVisible(true);
    try {
      const phoneContacts = await Contacts.getAll();
      setContacts(phoneContacts);
    } catch (e) {
      Alert.alert('Error', 'Failed to load contacts.');
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const handleImportModalClose = () => {
    setImportModalVisible(false);
    setContactSearchQuery('');
  };

  const handleSelectContact = (contact: Contacts.Contact) => {
    handleImportModalClose();
    setName(contact.displayName || `${contact.givenName} ${contact.familyName}`);
    setCompanyName(contact.company || '');
    setPhoneNumber(contact.phoneNumbers[0]?.number || '');
    setAddModalVisible(true);
  };
  
  const filteredContacts = useMemo(() => {
    const validContacts = contacts.filter(c => c.phoneNumbers.length > 0 && c.displayName);
    if (!contactSearchQuery) {
      return validContacts;
    }
    return validContacts.filter(contact =>
      contact.displayName?.toLowerCase().includes(contactSearchQuery.toLowerCase())
    );
  }, [contacts, contactSearchQuery]);


  return (
    <View style={styles.container}>
      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <WhiteSpace size="lg" />
        <View style={styles.buttonRow}>
          <View style={styles.buttonWrapper}>
            <Button type="primary" onPress={() => setAddModalVisible(true)} style={styles.button}>
              Add Client
            </Button>
          </View>
          <View style={styles.buttonWrapper}>
            <Button onPress={handleImportContacts} style={styles.button}>
              From Contacts
            </Button>
          </View>
        </View>
        <WhiteSpace size="lg" />
      </View>

      {/* Client List */}
      <List style={styles.list} renderHeader={() => 'Client List'}>
        {clients.map(client => (
          <TouchableOpacity 
            key={client.id}
            style={styles.customListItem}
            // --- THIS IS THE CRITICAL FIX ---
            // This now navigates BACK to the existing NewDeal screen with the selected client data
            onPress={() => 
              navigation.navigate({
                name: 'NewDeal',
                params: { selectedClientId: client.id, selectedClientName: client.name },
                merge: true,
              })
            }
          >
            <View style={styles.clientInfoContainer}>
              <Text style={styles.clientName} numberOfLines={1} ellipsizeMode="tail">
                {client.name}
              </Text>
              {client.companyName ? (
                <Text style={styles.companyName} numberOfLines={1} ellipsizeMode="tail">
                  {client.companyName}
                </Text>
              ) : null}
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </List>

      {/* Add Manually Modal */}
      <Modal visible={isAddModalVisible} onClose={handleModalClose} transparent maskClosable title="Add New Client" footer={[{ text: 'Cancel', onPress: handleModalClose }, { text: 'Save Client', onPress: handleSaveClient }]}>
        <List style={styles.modalContent}>
          <InputItem
            value={name}
            onChangeText={setName}
            placeholder="Full Name (Required)"
            placeholderTextColor="#888"
          />
          <InputItem
            value={companyName}
            onChangeText={setCompanyName}
            placeholder="Company Name"
            placeholderTextColor="#888"
          />
          <InputItem
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            type="phone"
            placeholder="Phone Number (Required)"
            placeholderTextColor="#888"
          />
        </List>
      </Modal>

      {/* Import Contacts Modal */}
      <Modal 
        visible={isImportModalVisible} 
        onClose={handleImportModalClose} 
        transparent 
        maskClosable 
        title="Select a Contact" 
        footer={[{ text: 'Close', onPress: handleImportModalClose }]}
      >
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={contactSearchQuery}
            placeholder="Search contacts..."
            onChangeText={text => setContactSearchQuery(text)}
            placeholderTextColor="#999"
          />
          {contactSearchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setContactSearchQuery('')} style={styles.clearButton}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <ScrollView style={styles.contactList}>
          {isLoadingContacts ? <ActivityIndicator /> : (
            <List>
              {filteredContacts.map(contact => (
                  <List.Item key={contact.recordID} onPress={() => handleSelectContact(contact)}>
                    {contact.displayName}
                  </List.Item>
                ))}
            </List>
          )}
        </ScrollView>
      </Modal>
    </View>
  );
};

// Styles remain the same
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f9' },
  buttonContainer: {
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  buttonWrapper: {
    flex: 1,
    minWidth: 160,
  },
  button: {
    height: 55,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: { marginTop: 0 },
  customListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  clientInfoContainer: {
    flex: 1,
    paddingRight: 10,
  },
  clientName: {
    fontSize: 17,
    color: '#000',
    fontWeight: '500',
    marginBottom: 2,
  },
  companyName: {
    color: '#999',
    fontSize: 14,
  },
  arrow: {
    fontSize: 18,
    color: '#ccc',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 25,
    margin: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
    color: '#666',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
  clearIcon: {
    fontSize: 16,
    color: '#999',
  },
  modalContent: { paddingTop: 10, paddingBottom: 20 },
  contactList: { maxHeight: 400, marginTop: 8 },
});

export default PartyListScreen;