import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  List,
  InputItem,
  DatePicker,
  TextareaItem,
  Button,
  WingBlank,
  WhiteSpace,
  Modal,
} from '@ant-design/react-native';
import { format } from 'date-fns';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/types';
import { addDeal } from '../services/Database';

type NewDealProps = NativeStackScreenProps<MainStackParamList, 'NewDeal'>;

interface SelectedClient {
  id: string;
  name: string;
}

const unitData = [
    { label: 'Lots', value: 'Lots' },
    { label: 'Meters', value: 'Meters' },
];

// Styles remain the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f9',
  },
  extraText: {
    fontSize: 17,
    color: '#108ee9',
  },
  placeholderText: {
    color: '#999',
    fontSize: 17,
  },
  extraContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 18,
    color: '#ccc',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  unitSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  inputItem: {
    paddingLeft: 16,
    paddingRight: 16,
  },
  saveButton: {
    height: 50,
    borderRadius: 8,
    marginBottom: 20,
  },
});

const NewDealScreen = ({ navigation, route }: NewDealProps) => {
  const [party, setParty] = useState<SelectedClient | null>(null);
  const [date, setDate] = useState(new Date());
  const [quality, setQuality] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState(['Meters']);
  const [rate, setRate] = useState('');
  const [notes, setNotes] = useState('');
  const [isUnitModalVisible, setUnitModalVisible] = useState(false);

  useEffect(() => {
    const { params } = route;
    if (params?.selectedClientId && params?.selectedClientName) {
      setParty({ id: params.selectedClientId, name: params.selectedClientName });
    }
  }, [route.params]);

  const handleSelectParty = () => {
    navigation.navigate('PartyList');
  };

  const handleSelectUnit = (selectedUnit: string) => {
    setUnit([selectedUnit]);
    setUnitModalVisible(false);
  };

  const handleSaveDeal = async () => {
    if (!party || !date || !quality.trim() || !quantity || !rate) {
      Alert.alert('Missing Information', 'Please fill all required fields.');
      return;
    }

    try {
      const dealToSave = {
        partyId: party.id,
        date: date.toISOString(),
        quality: quality.trim(),
        quantity: parseFloat(quantity),
        unit: unit[0],
        rate: parseFloat(rate),
        notes: notes.trim(),
      };

      await addDeal(dealToSave);

      Alert.alert('Success', 'New deal has been saved.');
      // --- THIS IS THE SECOND CRITICAL FIX ---
      // This ensures you always go back to the home screen.
      navigation.popToTop();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to save the deal.');
    }
  };

  return (
  <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
    <WhiteSpace size="lg" />
    
    <List renderHeader={() => 'Deal Details'}>
      {/* Party Selection */}
      <List.Item
        extra={
          <View style={styles.extraContainer}>
            <Text style={[styles.extraText, !party && styles.placeholderText]}>
              {party?.name || 'Select a client'}
            </Text>
            <Text style={styles.arrowText}>›</Text>
          </View>
        }
        onPress={handleSelectParty}
        wrap={false}
      >
        Party
      </List.Item>

      {/* Date Picker */}
      <DatePicker
        value={date}
        mode="date"
        onChange={setDate}
        format={val => format(val, 'dd-MMM-yyyy')}
      >
        <List.Item 
          extra={<Text style={styles.arrowText}>›</Text>}
          wrap={false}
        >
          Date
        </List.Item>
      </DatePicker>

      {/* Quality Input */}
      <InputItem
        value={quality}
        onChangeText={setQuality}
        placeholder="Enter fabric type"
        placeholderTextColor="#999"
        style={styles.inputItem}
        labelNumber={6}
      >
        Fabric
      </InputItem>

      {/* Quantity and Unit */}
      <InputItem
        value={quantity}
        onChangeText={setQuantity}
        type="number"
        placeholder="Enter quantity"
        placeholderTextColor="#999"
        style={styles.inputItem}
        labelNumber={6}
        extra={
          <TouchableOpacity 
            style={styles.unitSelector}
            onPress={() => setUnitModalVisible(true)}
          >
            <Text style={styles.extraText}>{unit[0]}</Text>
            <Text style={styles.arrowText}>›</Text>
          </TouchableOpacity>
        }
      >
        Quantity
      </InputItem>

      {/* Rate Input */}
      <InputItem
        value={rate}
        onChangeText={setRate}
        type="number"
        placeholder="Enter rate per unit"
        placeholderTextColor="#999"
        extra="₹"
        style={styles.inputItem}
        labelNumber={6}
      >
        Rate
      </InputItem>
    </List>

    {/* Notes */}
    <WhiteSpace size="lg" />
    <List renderHeader={() => 'Additional Notes (Optional)'}>
      <TextareaItem
        value={notes}
        onChangeText={setNotes}
        rows={3}
        placeholder="Add any additional details about this deal (optional)..."
        placeholderTextColor="#999"
        autoHeight
      />
    </List>
    
    <WhiteSpace size="lg" />
    
    <WingBlank size="lg">
      <Button type="primary" onPress={handleSaveDeal} style={styles.saveButton}>
        Save Deal
      </Button>
    </WingBlank>
    
    <WhiteSpace size="xl" />

    {/* Unit Selection Modal */}
    <Modal
      visible={isUnitModalVisible}
      onClose={() => setUnitModalVisible(false)}
      transparent
      maskClosable
      title="Select Unit"
      footer={[
        { text: 'Cancel', onPress: () => setUnitModalVisible(false) }
      ]}
    >
      <List>
        {unitData.map((unitOption) => (
          <List.Item
            key={unitOption.value}
            onPress={() => handleSelectUnit(unitOption.value)}
            extra={unit[0] === unitOption.value ? '✓' : ''}
          >
            {unitOption.label}
          </List.Item>
        ))}
      </List>
    </Modal>
  </ScrollView>
  );
};

export default NewDealScreen;