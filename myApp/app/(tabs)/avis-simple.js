import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../config/api';
import BottomNavBar from '../../components/BottomNavBar';

const API_URL = API_CONFIG.API_URL;

export default function AvisSimpleScreen() {
  const router = useRouter();
  const { commandeId } = useLocalSearchParams();
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState(0);
  const [commentaire, setCommentaire] = useState('');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        setUserId(user.id);
      }
    } catch (error) {
      console.error('Erreur chargement user:', error);
    }
  };

  const submitAvis = async () => {
    if (note === 0) {
      Alert.alert('Erreur', 'Veuillez donner une note');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/avis-commande-simple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          commande_id: commandeId,
          note: note,
          commentaire: commentaire
        })
      });

      const result = await response.json();
      
      if (result.success) {
        Alert.alert('Succès', 'Votre avis a été ajouté avec succès!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Erreur', result.message);
      }
    } catch (error) {
      console.error('Erreur ajout avis:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter l\'avis');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ec407a" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
        <BottomNavBar />
      </>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>⭐ Donner un avis</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>⭐ Évaluer la commande #{commandeId}</Text>
          
          <View style={styles.mainCard}>
            <Text style={styles.cardTitle}>Comment s'est passée votre commande ?</Text>
            <Text style={styles.cardSubtitle}>Donnez une note globale pour le service et vos produits</Text>
            
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setNote(star)}
                  style={styles.starButton}
                >
                  <Ionicons
                    name={star <= note ? 'star' : 'star-outline'}
                    size={40}
                    color={star <= note ? '#ffc107' : '#ddd'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.noteDescription}>
              {note === 0 && "Cliquez sur les étoiles pour noter"}
              {note === 1 && "😞 Très décevant"}
              {note === 2 && "😐 Décevant"}
              {note === 3 && "😊 Correct"}
              {note === 4 && "😃 Bien"}
              {note === 5 && "🤩 Excellent !"}
            </Text>
          </View>
          
          <View style={styles.commentCard}>
            <Text style={styles.label}>💬 Commentaire (optionnel)</Text>
            <TextInput
              style={styles.input}
              placeholder="Partagez votre expérience..."
              multiline
              numberOfLines={3}
              value={commentaire}
              onChangeText={setCommentaire}
              maxLength={300}
            />
            <Text style={styles.charCount}>{commentaire.length}/300</Text>
          </View>

          <TouchableOpacity
            style={[styles.button, { opacity: loading ? 0.7 : 1 }]}
            onPress={submitAvis}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? '⏳ Envoi...' : '📝 Envoyer l\'avis'}
            </Text>
          </TouchableOpacity>
          
          <View style={{ height: 50 }} />
        </ScrollView>
      </View>
      <BottomNavBar />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fce4ec',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fce4ec',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#ec407a',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ec407a',
    marginBottom: 20,
    textAlign: 'center',
  },
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 25,
    textAlign: 'center',
    lineHeight: 20,
  },
  starButton: {
    padding: 5,
  },
  noteDescription: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
    textAlign: 'center',
    fontWeight: '600',
  },
  commentCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 14,
    textAlignVertical: 'top',
    backgroundColor: '#f9f9f9',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#ec407a',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#ec407a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});