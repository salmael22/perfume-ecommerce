import { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, ScrollView, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../contexts/AuthContext';
import { ThemeContext } from '../../contexts/ThemeContext';
import { SmartRecommendationService } from '../../services/SmartRecommendationService';
import { PanierService } from '../../services/PanierService';

import BottomNavBar from '../../components/BottomNavBar';
import { getImageUrl } from '../../config/api';

const { width } = Dimensions.get('window');

export default function PromotionsScreen() {
  const { user } = useContext(AuthContext);
  const { colors } = useContext(ThemeContext);
  const [promotions, setPromotions] = useState([]);
  const [newParfums, setNewParfums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantites, setQuantites] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [promoData, newData] = await Promise.all([
        SmartRecommendationService.getPromotionalParfums(),
        SmartRecommendationService.getNewParfums(),
      ]);
      setPromotions((promoData || []).filter(item => item && item.id));
      setNewParfums((newData || []).filter(item => item && item.id));
    } catch (error) {
      console.error('Erreur chargement:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (parfum) => {
    try {
      // Calculer le prix final avec vérification des valeurs
      const originalPrice = parseFloat(parfum.prix || 0);
      const discount = parseFloat(parfum.discount_percentage || parfum.reduction || 0);
      
      let prixFinal;
      if (parfum.prix_final && !isNaN(parseFloat(parfum.prix_final))) {
        prixFinal = parseFloat(parfum.prix_final);
      } else if (parfum.has_active_promotion && discount > 0) {
        prixFinal = originalPrice * (1 - discount / 100);
      } else {
        prixFinal = originalPrice;
      }
      
      await PanierService.addToPanier(user.id, parfum.id, 1, prixFinal);
      
      const message = (parfum.has_active_promotion || discount > 0)
        ? `${parfum.nom} ajouté au panier avec promotion (-${discount}%)!`
        : `${parfum.nom} ajouté au panier!`;
      
      Alert.alert('Succès', message);
    } catch (error) {
      console.error('Erreur ajout panier:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter au panier');
    }
  };

  const renderPromoCard = ({ item, index }) => {
    // Vérification stricte
    if (!item || typeof item !== 'object' || !item.id) {
      return <View style={{ height: 1 }} />;
    }
    
    try {
      const quantite = quantites[item.id] || 1;
      
      return (
        <View style={[styles.card, { backgroundColor: '#fff' }]}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: getImageUrl(item.image_url) }}
              style={styles.image}
            />
            
            <View style={styles.categorieBadge}>
              <Text style={styles.categorieText}>👥</Text>
            </View>

            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-10%</Text>
            </View>

            <View style={styles.stockBadge}>
              <Text style={styles.stockText}>En stock</Text>
            </View>
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.marque}>
              {item.marque ? String(item.marque) : 'Marque'}
            </Text>
            <Text style={styles.nom} numberOfLines={2}>
              {item.nom ? String(item.nom) : 'Parfum'}
            </Text>
            
            <View style={styles.prixContainer}>
              <Text style={styles.oldPrice}>
                {item.prix ? String(Math.floor(parseFloat(item.prix))) : '0'}
              </Text>
              <Text style={styles.prix}>
                {item.prix ? String(Math.floor(parseFloat(item.prix) * 0.9)) : '0'}
              </Text>
              <Text style={styles.devise}>DH</Text>
            </View>

            <View style={styles.actions}>
              <View style={styles.quantiteContainer}>
                <TouchableOpacity 
                  style={styles.quantiteBtn}
                  onPress={() => {
                    if (quantite > 1) {
                      setQuantites({ ...quantites, [item.id]: quantite - 1 });
                    }
                  }}
                >
                  <Text style={styles.quantiteBtnText}>−</Text>
                </TouchableOpacity>
                
                <Text style={styles.quantiteValue}>{String(quantite)}</Text>
                
                <TouchableOpacity 
                  style={styles.quantiteBtn}
                  onPress={() => {
                    setQuantites({ ...quantites, [item.id]: quantite + 1 });
                  }}
                >
                  <Text style={styles.quantiteBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.boutonAjouter, { backgroundColor: '#6c5ce7' }]} 
                onPress={() => handleAddToCart(item)}
              >
                <Text style={styles.boutonText}>🛒</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    } catch (error) {
      console.log('Erreur render promo card:', error);
      return <View style={{ height: 1 }} />;
    }
  };



  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled={true}
      keyboardShouldPersistTaps="handled"
    >
      {/* Hero Header */}
      <View style={[styles.heroHeader, { backgroundColor: colors.primary }]}>
        <View style={styles.heroContent}>
          <Text style={styles.heroIcon}>🎉</Text>
          <Text style={styles.heroTitle}>Promotions & Nouveautés</Text>
          <Text style={styles.heroSubtitle}>Découvrez nos meilleures offres exclusives</Text>
        </View>
      </View>

      {/* Promotions */}
      {promotions.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🔥 En Promotion</Text>
            <Ionicons name="flame" size={20} color="#ff6b6b" />
          </View>
          <FlatList
            data={promotions}
            renderItem={({ item, index }) => renderPromoCard({ item, index })}
            keyExtractor={(item) => `promo-${item.id}`}
            numColumns={2}
            columnWrapperStyle={styles.row}
            scrollEnabled={false}
            contentContainerStyle={styles.listContent}
          />
        </View>
      )}

      {/* Nouveautés */}
      {newParfums.length > 0 && (
        <View style={styles.nouveautesSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>✨ Nouveautés</Text>
            <Ionicons name="sparkles" size={20} color="#ffd700" />
          </View>
          <FlatList
            data={newParfums}
            renderItem={({ item }) => (
              <View style={styles.nouveauteCard}>
                <View style={styles.nouveauBadge}>
                  <Text style={styles.nouveauBadgeText}>🆕 NOUVEAU</Text>
                </View>
                <Image
                  source={{ uri: getImageUrl(item.image_url) }}
                  style={styles.nouveauImage}
                />
                <View style={styles.nouveauContent}>
                  <Text style={[styles.nouveauNom, { color: colors.text }]} numberOfLines={2}>{item.nom}</Text>
                  <Text style={[styles.nouveauMarque, { color: colors.textSecondary }]}>{item.marque}</Text>
                  <Text style={[styles.nouveauPrice, { color: colors.primary }]}>{parseFloat(item.prix).toFixed(2)} DH</Text>
                  <TouchableOpacity
                    style={[styles.nouveauAddBtn, { backgroundColor: colors.primary }]}
                    onPress={() => handleAddToCart(item)}
                  >
                    <Ionicons name="cart" size={12} color="#fff" />
                    <Text style={styles.nouveauAddBtnText}>Ajouter</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            keyExtractor={(item) => `new-${item.id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 15 }}
            ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
            style={{ marginVertical: 10 }}
          />
        </View>
      )}

      {/* Message vide */}
      {promotions.length === 0 && newParfums.length === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="gift-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.text }]}>Aucune promotion</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Revenez bientôt pour découvrir nos offres
          </Text>
        </View>
      )}

      {/* Footer Spacing */}
      <View style={{ height: 100 }} />
    </ScrollView>
    <BottomNavBar />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroHeader: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroIcon: {
    fontSize: 50,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 15,
    borderRadius: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
  discountBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#e74c3c",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  discountText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
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
  oldPrice: {
    fontSize: 14,
    textDecorationLine: "line-through",
    marginRight: 8,
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
  quantiteContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 5,
  },
  quantiteBtn: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  quantiteBtnText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6c5ce7",
  },
  quantiteValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d3436",
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: "center",
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
  // Nouveaux styles pour les nouveautés compactes
  nouveautesSection: {
    paddingVertical: 15,
  },

  nouveauteCard: {
    width: 150,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  nouveauBadge: {
    backgroundColor: '#ffd700',
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  nouveauBadgeText: {
    fontWeight: 'bold',
    fontSize: 10,
    color: '#333',
  },
  nouveauImage: {
    width: '100%',
    height: 100,
    resizeMode: 'cover',
  },
  nouveauContent: {
    padding: 8,
  },
  nouveauNom: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'center',
  },
  nouveauMarque: {
    fontSize: 10,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  nouveauPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  nouveauAddBtn: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
  },
  nouveauAddBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
