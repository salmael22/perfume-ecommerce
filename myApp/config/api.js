// Configuration API centralisée avec gestion d'erreurs
export const API_CONFIG = {
  // Toutes tes adresses IP détectées
  POSSIBLE_URLS: [
    'http://192.168.11.102:3000', // Ton IP WiFi principale
    'http://20.30.1.163:3000',    // Ton IP réseau externe
    'http://192.168.113.1:3000',  // Adresse réseau virtuel
    'http://192.168.145.1:3000',  // Autre adresse réseau
    'http://192.168.219.1:3000',  // Autre adresse réseau
    'http://localhost:3000'       // Localhost en dernier recours
  ],
  BASE_URL: 'http://192.168.11.102:3000',
  API_URL: 'http://192.168.11.102:3000/api',
  TIMEOUT: 8000 // 8 secondes
};

// Fonction pour tester et trouver la bonne URL
export const findWorkingUrl = async () => {
  for (const url of API_CONFIG.POSSIBLE_URLS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('✅ URL fonctionnelle trouvée:', url);
        API_CONFIG.BASE_URL = url;
        API_CONFIG.API_URL = `${url}/api`;
        return url;
      }
    } catch (error) {
      console.log('❌ URL non accessible:', url);
      continue;
    }
  }
  
  throw new Error('Aucun serveur accessible. Vérifiez que le backend est démarré.');
};

// Fonction utilitaire pour les requêtes avec retry
export const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Connexion timeout - Vérifiez que le serveur backend est démarré');
    }
    throw error;
  }
};

// Fonction utilitaire pour construire les URLs d'images
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return 'https://via.placeholder.com/150?text=Parfum';
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${API_CONFIG.BASE_URL}${imageUrl}`;
};