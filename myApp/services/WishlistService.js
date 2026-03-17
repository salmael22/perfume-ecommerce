import { API_CONFIG } from '../config/api';

const API_URL = API_CONFIG.API_URL;

export const WishlistService = {
  // Récupérer la wishlist d'un utilisateur
  getWishlist: async (userId) => {
    try {
      console.log('🔍 WishlistService.getWishlist - URL:', `${API_URL}/wishlist/${userId}`);
      const response = await fetch(`${API_URL}/wishlist/${userId}`);
      console.log('🔍 WishlistService.getWishlist - Response status:', response.status);
      if (!response.ok) throw new Error('Erreur lors du chargement de la wishlist');
      const data = await response.json();
      console.log('🔍 WishlistService.getWishlist - Data:', data);
      return data;
    } catch (error) {
      console.error('Erreur WishlistService.getWishlist:', error);
      throw error;
    }
  },

  // Ajouter à la wishlist
  addToWishlist: async (userId, parfumId, notePersonnelle = '', priorite = 'moyenne') => {
    try {
      const response = await fetch(`${API_URL}/wishlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          parfum_id: parfumId,
          note_personnelle: notePersonnelle,
          priorite: priorite
        })
      });
      
      if (!response.ok) throw new Error('Erreur lors de l\'ajout à la wishlist');
      return await response.json();
    } catch (error) {
      console.error('Erreur WishlistService.addToWishlist:', error);
      throw error;
    }
  },

  // Retirer de la wishlist
  removeFromWishlist: async (userId, parfumId) => {
    try {
      const response = await fetch(`${API_URL}/wishlist/${userId}/${parfumId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Erreur lors de la suppression de la wishlist');
      return await response.json();
    } catch (error) {
      console.error('Erreur WishlistService.removeFromWishlist:', error);
      throw error;
    }
  },

  // Vérifier si un parfum est dans la wishlist
  isInWishlist: async (userId, parfumId) => {
    try {
      const response = await fetch(`${API_URL}/wishlist/${userId}/${parfumId}`);
      if (!response.ok) throw new Error('Erreur lors de la vérification');
      const data = await response.json();
      return data.inWishlist;
    } catch (error) {
      console.error('Erreur WishlistService.isInWishlist:', error);
      return false;
    }
  }
};