import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import BottomNavBar from '../../components/BottomNavBar';

export default function TestAvisScreen() {
  const router = useRouter();
  const { commandeId } = useLocalSearchParams();

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.title}>Page d'avis - Test</Text>
        <Text style={styles.subtitle}>Commande ID: {commandeId}</Text>
        <Text style={styles.text}>Si vous voyez ce message, la navigation fonctionne !</Text>
      </View>
      <BottomNavBar />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fce4ec',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ec407a',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
});