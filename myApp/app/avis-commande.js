import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, getImageUrl } from '../config/api';

const API_URL = API_CONFIG.API_URL;

export default function AvisCommandeScreen() {
  const router = useRouter();
  const { commandeId } = useLocalSearchParams();
  const [userId, setUserId] = useState(null);
  const [parfums, setParfums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avisData, setAvisData] = useState({});

  useEffect(() => {
    loadUserAndParfums();
  }, []);

  const loadUserAndParfums = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        setUserId(user.id);
        await fetchParfumsCommande(commandeId, user.id);
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const fetchParfumsCommande = async (commandeId, userId) => {
    try {
      const response = await fetch(`${API_URL}/commandes/${commandeId}/parfums-avis/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setParfums(data);
        
        // Initialiser les données d'avis
        const initialAvis = {};
        data.forEach(parfum => {
          if (parfum.avis_donne) {
            initialAvis[parfum.parfum_id] = {
              note: parfum.note,
              commentaire: parfum.commentaire || ''
            };
          } else {
            initialAvis[parfum.parfum_id] = {
              note: 0,
              commentaire: ''
            };
          }
        });
        setAvisData(initialAvis);
      }
    } catch (error) {
      console.error('Erreur chargement parfums:', error);
    }
  };

  const updateAvis = (parfumId, field, value) => {
    setAvisData(prev => ({
      ...prev,
      [parfumId]: {
        ...prev[parfumId],
        [field]: value
      }
    }));
  };

  const submitAvis = async (parfumId) => {
    const avis = avisData[parfumId];
    
    if (!avis.note || avis.note === 0) {
      Alert.alert('Erreur', 'Veuillez donner une note');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/avis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          parfum_id: parfumId,
          commande_id: commandeId,
          note: avis.note,
          commentaire: avis.commentaire
        })
      });

      const result = await response.json();
      
      if (result.success) {
        Alert.alert('Succès', 'Votre avis a été ajouté avec succès!');
        // Recharger les données
        await fetchParfumsCommande(commandeId, userId);
      } else {
        Alert.alert('Erreur', result.message);
      }
    } catch (error) {
      console.error('Erreur ajout avis:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter l\'avis');
    }
  };

  const renderStars = (parfumId, currentNote) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity
            key={star}
            onPress={() => updateAvis(parfumId, 'note', star)}
          >
            <Ionicons
              name={star <= currentNote ? 'star' : 'star-outline'}
              size={30}
              color={star <= currentNote ? '#ffc107' : '#ddd'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>⭐ Donner un avis</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.subtitle}>Commande #{commandeId}</Text>
        <Text style={styles.description}>
          Votre avis nous aide à améliorer nos produits et aide d'autres clients dans leurs choix.
        </Text>

        {parfums.map(parfum => (
          <View key={parfum.parfum_id} style={styles.parfumCard}>
            <View style={styles.parfumHeader}>
              <Image
                source={{ uri: getImageUrl(parfum.parfum_image_url) }}
                style={styles.parfumImage}
              />
              <View style={styles.parfumInfo}>
                <Text style={styles.parfumNom}>{parfum.parfum_nom}</Text>
                <Text style={styles.parfumMarque}>{parfum.parfum_marque}</Text>
                <Text style={styles.parfumPrix}>{parfum.prix_unitaire} DH</Text>
              </View>
            </View>

            {parfum.avis_donne ? (
              <View style={styles.avisExistant}>
                <Text style={styles.avisExistantTitle}>✅ Avis déjà donné</Text>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Ionicons
                      key={star}
                      name={star <= parfum.note ? 'star' : 'star-outline'}
                      size={20}
                      color={star <= parfum.note ? '#ffc107' : '#ddd'}
                    />
                  ))}
                </View>
                {parfum.commentaire && (
                  <Text style={styles.commentaireExistant}>"{parfum.commentaire}"</Text>
                )}
              </View>
            ) : (
              <View style={styles.avisForm}>
                <Text style={styles.noteLabel}>Note :</Text>
                {renderStars(parfum.parfum_id, avisData[parfum.parfum_id]?.note || 0)}
                
                <Text style={styles.commentaireLabel}>Commentaire (optionnel) :</Text>
                <TextInput
                  style={styles.commentaireInput}
                  placeholder="Partagez votre expérience avec ce parfum..."
                  multiline
                  numberOfLines={3}
                  value={avisData[parfum.parfum_id]?.commentaire || ''}
                  onChangeText={(text) => updateAvis(parfum.parfum_id, 'commentaire', text)}
                />

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={() => submitAvis(parfum.parfum_id)}
                >
                  <Text style={styles.submitButtonText}>Envoyer l'avis</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  parfumCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  parfumHeader: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  parfumImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  parfumInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  parfumNom: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  parfumMarque: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  parfumPrix: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28a745',
  },
  avisExistant: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  avisExistantTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 8,
  },
  commentaireExistant: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
  avisForm: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 15,
  },
  noteLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  commentaireLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  commentaireInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  submitButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});