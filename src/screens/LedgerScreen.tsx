// src/screens/LedgerScreen.tsx

import React, { useState, useCallback, useMemo, useLayoutEffect, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Card, WhiteSpace, DatePicker, Button, List } from '@ant-design/react-native';
import { format } from 'date-fns';
import { getDeals, deleteDeal, Deal } from '../services/Database';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/AppNavigator';
import Icon from 'react-native-vector-icons/Ionicons';

type LedgerScreenProps = NativeStackScreenProps<MainStackParamList, 'Ledger'>;

// --- FIX 1: Add the 'route' prop here ---
const LedgerScreen = ({ navigation, route }: LedgerScreenProps) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          onPress={() => navigation.navigate('Settings')} 
          style={{ padding: 8 }}
        >
          <Icon name="settings-outline" size={24} color="#333" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const loadData = useCallback(async () => {
    const savedDeals = await getDeals();
    setDeals(savedDeals);
  }, []);

  // --- FIX 2: Replace useFocusEffect with this more robust useEffect ---
  useEffect(() => {
    // This listener reloads data every time the screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    // This specifically handles the refresh after an import
    if (route.params?.refresh) {
      loadData();
    }
    
    // Cleanup the listener when the component unmounts
    return unsubscribe;
  }, [navigation, route.params?.refresh, loadData]);

  const handleDeletePress = (deal: Deal) => {
    Alert.alert(
      'Delete Deal',
      `Are you sure you want to delete the deal with ${deal.partyName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDeal(deal.id);
              loadData(); // Reload data after deletion
            } catch (error) {
              Alert.alert('Error', 'Failed to delete the deal.');
            }
          },
        },
      ]
    );
  };

  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      const partyMatch = (deal.partyName || '').toLowerCase().includes(searchQuery.toLowerCase());
      const qualityMatch = (deal.quality || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const dateMatch = selectedDate
        ? new Date(deal.date).toDateString() === selectedDate.toDateString()
        : true;

      return (partyMatch || qualityMatch) && dateMatch;
    });
  }, [deals, searchQuery, selectedDate]);

  const groupedDeals = useMemo(() => {
    const groups: { [key: string]: Deal[] } = {};
    filteredDeals.forEach(deal => {
      const dealDate = deal.date.substring(0, 10);
      if (!groups[dealDate]) groups[dealDate] = [];
      groups[dealDate].push(deal);
    });
    return groups;
  }, [filteredDeals]);

  const sortedDates = Object.keys(groupedDeals).sort((a, b) => b.localeCompare(a));

  return (
    <View style={styles.container}>
      {/* Search and Date UI */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBarWrapper}>
          <View style={styles.searchInputContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              placeholder="Search by Party or Quality..."
              onChangeText={text => setSearchQuery(text)}
              placeholderTextColor="#999"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <DatePicker
          value={selectedDate || new Date()}
          mode="date"
          onChange={date => setSelectedDate(date)}
          format={val => format(val, 'dd-MMM-yyyy')}
        >
          <TouchableOpacity style={styles.datePickerButton}>
            <Icon name="calendar-outline" size={24} color={selectedDate ? '#1677ff' : '#555'} />
          </TouchableOpacity>
        </DatePicker>
      </View>

      {selectedDate && (
        <View style={styles.clearButtonContainer}>
          <Button size="small" type="ghost" onPress={() => setSelectedDate(null)}>
            Clear Filter: {format(selectedDate, 'dd MMM yyyy')}
          </Button>
        </View>
      )}

      {/* ScrollView for Deals */}
      <ScrollView style={styles.scrollContainer}>
        {sortedDates.length > 0 ? (
          sortedDates.map(date => (
            <View key={date}>
              <WhiteSpace size="md" />
              <Card>
                <Card.Header title={format(new Date(date), 'EEEE, d MMMM yyyy')} />
                <Card.Body>
                  <List>
                    {groupedDeals[date].map(deal => (
                      <TouchableOpacity
                        key={deal.id}
                        onPress={() => navigation.navigate('DealDetail', { dealId: deal.id })}
                        onLongPress={() => handleDeletePress(deal)}
                      >
                        <List.Item>
                          {deal.partyName}
                          <List.Item.Brief>{deal.quality}</List.Item.Brief>
                        </List.Item>
                      </TouchableOpacity>
                    ))}
                  </List>
                </Card.Body>
              </Card>
            </View>
          ))
        ) : (
          <Text style={styles.noResultsText}>No deals found.</Text>
        )}
        <WhiteSpace size="xl" />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('NewDeal')}>
        <Icon name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f9' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white' },
  searchBarWrapper: { flex: 1 },
  searchInputContainer: {
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
  datePickerButton: { paddingHorizontal: 16, paddingVertical: 12 },
  clearButtonContainer: { padding: 8, alignItems: 'flex-start' },
  scrollContainer: { flex: 1 },
  noResultsText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#888' },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#1677ff', alignItems: 'center', justifyContent: 'center', elevation: 8 },
});

export default LedgerScreen;