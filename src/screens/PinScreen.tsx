import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Flex, WingBlank, WhiteSpace } from '@ant-design/react-native';
// import Icon from '@ant-design/icons-react-native'; // Removed because Icon is not a valid JSX component

const PIN_STORAGE_KEY = '@CoreApp:pin';

interface PinScreenProps {
  onSuccess: () => void; // A function to call when login is successful
}

const PinScreen = ({ onSuccess }: PinScreenProps) => {
  const [pin, setPin] = useState('');
  const [headline, setHeadline] = useState('Loading...');
  const [mode, setMode] = useState<'create' | 'confirm' | 'verify'>('verify');
  const [firstPin, setFirstPin] = useState('');

  // On component mount, check if a PIN is already saved
  useEffect(() => {
    const checkPin = async () => {
      const savedPin = await AsyncStorage.getItem(PIN_STORAGE_KEY);
      if (savedPin) {
        setMode('verify');
        setHeadline('Enter your PIN');
      } else {
        setMode('create');
        setHeadline('Create a new 4-digit PIN');
      }
    };
    checkPin();
  }, []);

  // This effect runs whenever the PIN length reaches 4
  useEffect(() => {
    if (pin.length === 4) {
      handlePinSubmit(pin);
    }
  }, [pin]);

  const handleKeyPress = (key: string) => {
    if (pin.length < 4) {
      setPin(pin + key);
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const handlePinSubmit = async (submittedPin: string) => {
    if (mode === 'create') {
      setFirstPin(submittedPin);
      setMode('confirm');
      setHeadline('Confirm your PIN');
      setPin(''); // Reset for confirmation entry
    } else if (mode === 'confirm') {
      if (firstPin === submittedPin) {
        await AsyncStorage.setItem(PIN_STORAGE_KEY, submittedPin);
        Alert.alert('PIN Created', 'You can now use this PIN to unlock your app.');
        onSuccess();
      } else {
        Alert.alert('Error', "PINs do not match. Let's try again.");
        setMode('create');
        setHeadline('Create a new 4-digit PIN');
        setFirstPin('');
        setPin('');
      }
    } else if (mode === 'verify') {
      const savedPin = await AsyncStorage.getItem(PIN_STORAGE_KEY);
      if (savedPin === submittedPin) {
        onSuccess();
      } else {
        Alert.alert('Incorrect PIN', 'Please try again.');
        setPin('');
      }
    }
  };

  const PinDots = () => (
    <View style={styles.dotsContainer}>
      {Array(4).fill(0).map((_, i) => (
        <View key={i} style={[styles.dot, i < pin.length ? styles.dotFilled : null]} />
      ))}
    </View>
  );

  const NumpadKey = ({ value }: { value: string }) => (
    <TouchableOpacity style={styles.key} onPress={() => handleKeyPress(value)}>
      <Text style={styles.keyText}>{value}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <WingBlank style={styles.content}>
        <Text style={styles.headline}>{headline}</Text>
        <WhiteSpace size="xl" />
        <PinDots />
        <WhiteSpace size="xl" />
      </WingBlank>

      <View style={styles.numpad}>
        <Flex justify="center">
          <NumpadKey value="1" />
          <NumpadKey value="2" />
          <NumpadKey value="3" />
        </Flex>
        <Flex justify="center">
          <NumpadKey value="4" />
          <NumpadKey value="5" />
          <NumpadKey value="6" />
        </Flex>
        <Flex justify="center">
          <NumpadKey value="7" />
          <NumpadKey value="8" />
          <NumpadKey value="9" />
        </Flex>
        <Flex justify="center">
          <View style={styles.key} />
          <NumpadKey value="0" />
          <TouchableOpacity style={styles.key} onPress={handleDelete}>
            <Text style={styles.keyText}>{'\u232B'}</Text> {/* Unicode for erase/backspace */}
          </TouchableOpacity>
        </Flex>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f9',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headline: {
    fontSize: 22,
    color: '#333',
    fontWeight: 'bold',
  },
  dotsContainer: {
    flexDirection: 'row',
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#108ee9',
    margin: 10,
  },
  dotFilled: {
    backgroundColor: '#108ee9',
  },
  numpad: {
    paddingBottom: 40,
  },
  key: {
    width: 75,
    height: 75,
    borderRadius: 40,
    margin: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  keyText: {
    fontSize: 28,
    color: '#333',
  },
});

export default PinScreen;