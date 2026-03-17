// Configuration réseau pour différents environnements
import { Platform } from 'react-native';

// Détection automatique de l'environnement
const getApiUrl = () => {
  // Pour l'émulateur Android
  if (Platform.OS === 'android' && __DEV__) {
    return 'http://10.0.2.2:3000';
  }
  
  // Pour téléphone physique (remplace par ton IP)
  return 'http://192.168.11.102:3000';
};

export const NETWORK_CONFIG = {
  BASE_URL: getApiUrl(),
  API_URL: `${getApiUrl()}/api`,
  TIMEOUT: 15000, // 15 secondes pour téléphone
  RETRY_ATTEMPTS: 3
};

// Test de connectivité
export const testConnection = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(NETWORK_CONFIG.BASE_URL, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log('Test de connexion échoué:', error.message);
    return false;
  }
};