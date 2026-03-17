import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, getImageUrl } from '../../config/api';
import BottomNavBar from '../../components/BottomNavBar';

const API_URL = API_CONFIG.API_URL;

export default function AvisCommandeScreen() {
  const router = useRouter();
  const { commandeId } = useLocalSearchParams();
  const [userId, setUserId] = useState(null);
  const [parfums, setParfums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avisData, setAvisData] = useState({});

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (userId && commandeId) {
      fetchParfumsCommande(commandeId, userId);
    }
  }, [userId, commandeId]);

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

  const fetchParfumsCommande = async (commandeId, userId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/commandes/${commandeId}/parfums-avis/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setParfums(data.parfums);
        
        const initialAvis = {};
        data.parfums.forEach(parfum => {
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
    } finally {
      setLoading(false);
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
        fetchParfumsCommande(commandeId, userId);
      } else {
        Alert.alert('Erreur', result.message);
      }
    } catch (error) {
      console.error('Erreur ajout avis:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter l\'avis');
    }
  };

  const getStarLabel = (note) => {
    const labels = {
      1: "😞 Très décevant",
      2: "😐 Pas terrible", 
      3: "🙂 Correct",
      4: "😊 Très bien",
      5: "🤩 Excellent !"
    };
    return labels[note] || "Cliquez sur les étoiles";
  };

  const renderStars = (parfumId, currentNote) => {
    return (
      <View style={styles.ratingSection}>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map(star => (
            <TouchableOpacity
              key={star}
              onPress={() => updateAvis(parfumId, 'note', star)}
              style={[
                styles.starButton,
                star <= currentNote && styles.starButtonActive
              ]}
              activeOpacity={0.7}
            >
              <Ionicons
                name={star <= currentNote ? 'star' : 'star-outline'}
                size={40}
                color={star <= currentNote ? '#ffc107' : '#ddd'}
              />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.ratingLabel, { color: currentNote > 0 ? '#ec407a' : '#999' }]}>
          {getStarLabel(currentNote)}
        </Text>
        {currentNote > 0 && (
          <Text style={styles.ratingValue}>
            {currentNote}/5 étoile{currentNote > 1 ? 's' : ''}
          </Text>
        )}
      </View>
    );
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>⭐ Donner un avis</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.subtitle}>Commande #{commandeId}</Text>
          <Text style={styles.description}>
            Votre avis nous aide à améliorer nos produits
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
                  <View style={styles.avisExistantHeader}>
                    <Ionicons name="checkmark-circle" size={24} color="#4caf50" />
                    <Text style={styles.avisExistantTitle}>Avis publié</Text>
                  </View>
                  
                  <View style={styles.avisExistantContent}>
                    <Text style={styles.avisExistantLabel}>Votre note :</Text>
                    <View style={styles.starsExistant}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Ionicons
                          key={star}
                          name={star <= parfum.note ? 'star' : 'star-outline'}
                          size={22}
                          color={star <= parfum.note ? '#ffc107' : '#ddd'}
                        />
                      ))}
                      <Text style={styles.noteExistante}>{parfum.note}/5</Text>
                    </View>
                    
                    {parfum.commentaire && (
                      <>
                        <Text style={styles.avisExistantLabel}>Votre commentaire :</Text>
                        <View style={styles.commentaireExistantContainer}>
                          <Text style={styles.commentaireExistant}>"{parfum.commentaire}"</Text>
                        </View>
                      </>
                    )}
                    
                    <Text style={styles.avisDateText}>
                      Publié le {new Date().toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.avisForm}>
                  <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>🌟 Votre évaluation</Text>
                    <Text style={styles.sectionSubtitle}>Cliquez sur les étoiles pour noter ce parfum</Text>
                    {renderStars(parfum.parfum_id, avisData[parfum.parfum_id]?.note || 0)}
                  </View>
                  
                  <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>💭 Votre avis</Text>
                    <Text style={styles.sectionSubtitle}>Partagez votre expérience (optionnel)</Text>
                    <TextInput
                      style={styles.commentaireInput}
                      placeholder="Décrivez ce que vous avez pensé de ce parfum : odeur, tenue, qualité..."
                      multiline
                      numberOfLines={4}
                      value={avisData[parfum.parfum_id]?.commentaire || ''}
                      onChangeText={(text) => updateAvis(parfum.parfum_id, 'commentaire', text)}
                      maxLength={500}
                    />
                    <Text style={styles.characterCount}>
                      {(avisData[parfum.parfum_id]?.commentaire || '').length}/500 caractères
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      (avisData[parfum.parfum_id]?.note || 0) === 0 && styles.submitButtonDisabled
                    ]}
                    onPress={() => submitAvis(parfum.parfum_id)}
                    disabled={(avisData[parfum.parfum_id]?.note || 0) === 0}
                  >
                    <Ionicons name="send" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>
                      {(avisData[parfum.parfum_id]?.note || 0) === 0 ? 'Donnez une note d\'abord' : 'Publier mon avis'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
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
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    padding: 5,
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
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  parfumCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
  },
  parfumHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  parfumImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  parfumInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  parfumNom: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  parfumMarque: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  parfumPrix: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ec407a',
  },
  avisExistant: {
    backgroundColor: '#f0f8f0',
    padding: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#c8e6c9',
  },
  avisExistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    gap: 8,
  },
  avisExistantTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  avisExistantContent: {
    alignItems: 'center',
  },
  avisExistantLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  starsExistant: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 3,
  },
  noteExistante: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffc107',
    marginLeft: 8,
  },
  commentaireExistantContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  commentaireExistant: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  avisDateText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  avisForm: {
    alignItems: 'stretch',
  },
  formSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  ratingSection: {
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
    gap: 8,
  },
  starButton: {
    padding: 8,
    borderRadius: 25,
    backgroundColor: '#f8f8f8',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  starButtonActive: {
    backgroundColor: '#fff3cd',
    elevation: 4,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  ratingValue: {
    fontSize: 14,
    color: '#ffc107',
    fontWeight: '600',
  },
  commentaireInput: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 15,
    padding: 15,
    fontSize: 14,
    textAlignVertical: 'top',
    backgroundColor: '#fafafa',
    marginBottom: 8,
    minHeight: 100,
    fontFamily: 'System',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginBottom: 20,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#ec407a',
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    elevation: 6,
    shadowColor: '#ec407a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    elevation: 2,
    shadowOpacity: 0.1,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});