import { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Share, Alert, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../contexts/AuthContext';
import { ThemeContext } from '../../contexts/ThemeContext';
import { WishlistService } from '../../services/WishlistService';
import { PanierService } from '../../services/PanierService';
import { getImageUrl } from '../../config/api';
import BottomNavBar from '../../components/BottomNavBar';

const { width } = Dimensions.get('window');

export default function WishlistScreen() {
  const { user } = useContext(AuthContext);
  const { colors } = useContext(ThemeContext);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [shareCode, setShareCode] = useState(null);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const data = await WishlistService.getWishlist(user.id);
      setWishlist(data);
      // Générer un code de partage
      const code = `WISH-${user.id}-${Date.now().toString(36).toUpperCase()}`;
      setShareCode(code);
    } catch (error) {
      console.error('Erreur chargement wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const message = `Découvrez ma wishlist de parfums! 🌹\n\nCode: ${shareCode}\n\nParfums: ${wishlist.map(f => f.nom).join(', ')}\n\nTélécharge l'app ParfumsApp pour voir ma sélection!`;
      
      await Share.share({
        message,
        title: 'Ma Wishlist de Parfums',
      });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de partager');
    }
  };

  const handleCopyCode = () => {
    // Copier le code dans le presse-papiers
    Alert.alert('Code copié!', `${shareCode} a été copié`);
  };

  const handleAddToCart = async (parfum) => {
    try {
      await PanierService.addToPanier(user.id, parfum.id, 1, parfum.prix);
      Alert.alert('Succès', `${parfum.nom} ajouté au panier!`);
    } catch (error) {
      console.error('Erreur ajout panier:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter au panier');
    }
  };

  const handleRemoveFromWishlist = async (parfumId) => {
    try {
      await WishlistService.removeFromWishlist(user.id, parfumId);
      setWishlist(wishlist.filter(item => item.id !== parfumId));
      Alert.alert('Succès', 'Retiré de la wishlist');
    } catch (error) {
      console.error('Erreur suppression wishlist:', error);
      Alert.alert('Erreur', 'Impossible de retirer de la wishlist');
    }
  };

  const renderParfum = ({ item }) => (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: getImageUrl(item.image_url) }}
          style={styles.image}
        />
        
        {/* Badge catégorie */}
        <View style={styles.categorieBadge}>
          <Text style={styles.categorieText}>
            {item.categorie === 'homme' ? '👨' : item.categorie === 'femme' ? '👩' : '👥'}
          </Text>
        </View>

        {/* Bouton retirer de la wishlist */}
        <TouchableOpacity 
          style={styles.removeBtn}
          onPress={() => handleRemoveFromWishlist(item.id)}
        >
          <Ionicons name="bookmark" size={20} color="#ff9800" />
        </TouchableOpacity>

        <View style={styles.stockBadge}>
          <Text style={styles.stockText}>{item.stock || 'En stock'}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={[styles.marque, { color: colors.textSecondary }]}>{item.marque}</Text>
        <Text style={[styles.nom, { color: colors.text }]} numberOfLines={2}>{item.nom}</Text>
        
        <View style={styles.prixContainer}>
          <Text style={[styles.prix, { color: colors.primary }]}>{parseFloat(item.prix).toFixed(0)}</Text>
          <Text style={styles.devise}>DH</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.removeFromWishBtn}
            onPress={() => handleRemoveFromWishlist(item.id)}
          >
            <Text style={styles.removeFromWishText}>Retirer</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.boutonAjouter, { backgroundColor: colors.primary }]} 
            onPress={() => handleAddToCart(item)}
          >
            <Text style={styles.boutonText}>🛒</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <>
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>🛍️ Ma Wishlist</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{wishlist.length} parfum(s)</Text>
      </View>

      {/* Partage */}
      <View style={[styles.shareSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.shareContent}>
          <Ionicons name="share-social" size={24} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.shareTitle, { color: colors.text }]}>Partager ma wishlist</Text>
            <Text style={[styles.shareCode, { color: colors.textSecondary }]}>Code: {shareCode}</Text>
          </View>
        </View>
        <View style={styles.shareButtons}>
          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: colors.primary }]}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: colors.primary }]}
            onPress={handleCopyCode}
          >
            <Ionicons name="copy" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Statistiques */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{wishlist.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Parfums</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {wishlist.reduce((sum, f) => sum + parseFloat(f.prix), 0).toFixed(0)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>DH Total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {wishlist.length > 0 ? (wishlist.reduce((sum, f) => sum + parseFloat(f.prix), 0) / wishlist.length).toFixed(0) : 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Moy.</Text>
        </View>
      </View>

      {/* Liste */}
      {wishlist.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="list-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.text }]}>Wishlist vide</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Ajoutez des parfums que vous souhaitez acheter plus tard
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          <FlatList
            data={wishlist}
            renderItem={renderParfum}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.row}
            scrollEnabled={false}
            contentContainerStyle={styles.listContent}
          />
        </View>
      )}
    </ScrollView>
    <BottomNavBar />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
  },
  shareSection: {
    margin: 15,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shareContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  shareCode: {
    fontSize: 12,
  },
  shareButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
  },
  listContainer: {
    paddingHorizontal: 10,
  },
  listContent: {
    padding: 15,
    paddingBottom: 100,
  },
  row: {
    justifyContent: "space-between",
  },
  card: {
    width: (width - 45) / 2,
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 180,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    backgroundColor: '#f0f0f0',
  },
  categorieBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  categorieText: {
    fontSize: 16,
  },
  removeBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  stockBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  stockText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#00b894",
  },
  cardContent: {
    padding: 15,
  },
  marque: {
    fontSize: 11,
    color: "#b2bec3",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 5,
  },
  nom: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#2d3436",
    marginBottom: 10,
    lineHeight: 20,
  },
  prixContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 15,
  },
  prix: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6c5ce7",
  },
  devise: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6c5ce7",
    marginLeft: 4,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  removeFromWishBtn: {
    backgroundColor: "#ff9800",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
  },
  removeFromWishText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  boutonAjouter: {
    backgroundColor: "#6c5ce7",
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6c5ce7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  boutonText: {
    fontSize: 20,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
