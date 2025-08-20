import React, { useState, useEffect, useLayoutEffect } from 'react';
import { ScrollView, StyleSheet, Text, View, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/AppNavigator';
import { getDealById, deleteDeal, Deal } from '../services/Database';
import { Card, List, WhiteSpace } from '@ant-design/react-native';
import { format } from 'date-fns';

type Props = NativeStackScreenProps<MainStackParamList, 'DealDetail'>;

const DealDetailScreen = ({ route, navigation }: Props) => {
  const { dealId } = route.params;
  const [deal, setDeal] = useState<Deal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleDelete = () => {
    if (!deal) return;
    Alert.alert(
      'Delete Deal',
      'Are you sure you want to delete this deal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDeal(deal.id);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete the deal.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };
  
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Delete</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, deal]);

  useEffect(() => {
    const loadDeal = async () => {
      try {
        const dealData = await getDealById(dealId);
        setDeal(dealData);
        if (dealData) {
          navigation.setOptions({ title: `Deal with ${dealData.partyName}` });
        }
      } catch (error) {
        console.error("Failed to load deal details:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadDeal();
  }, [dealId, navigation]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  
  if (!deal) {
    return (
      <View style={styles.centered}>
        <Text>Deal not found.</Text>
      </View>
    );
  }

  const formattedRate = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(deal.rate);

  return (
    <ScrollView style={styles.container}>
      <WhiteSpace size="lg" />
      <Card>
        <Card.Header title="Deal Information" />
        <Card.Body>
            <List>
              <>
              <List.Item extra={deal.partyName}><Text>Party</Text></List.Item>
              <List.Item extra={format(new Date(deal.date), 'd MMM yyyy')}><Text>Date</Text></List.Item>
              <List.Item extra={deal.quality}><Text>Quality / Fabric</Text></List.Item>
              <List.Item extra={`${deal.quantity} ${deal.unit}`}><Text>Quantity</Text></List.Item>
              <List.Item extra={formattedRate}><Text>Rate</Text></List.Item>
              {/* This logic correctly avoids rendering null or string */}
              {deal.notes && (
                <List.Item extra={<Text style={styles.notes}>{deal.notes}</Text>}>
                  <Text>Notes</Text>
                </List.Item>
              )}
              </>
            </List>
          </Card.Body>
      </Card>
      <WhiteSpace size="lg" />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f9' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notes: { flex: 1, textAlign: 'right', color: '#595959', fontSize: 16 },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerButtonText: {
    color: '#ff4d4f',
    fontSize: 17,
  },
});

export default DealDetailScreen;