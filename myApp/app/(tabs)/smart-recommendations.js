import { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, ScrollView, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AuthContext } from '../../contexts/AuthContext';
import { ThemeContext } from '../../contexts/ThemeContext';
import { SmartRecommendationService } from '../../services/SmartRecommendationService';
import { PanierService } from '../../services/PanierService';

import { getImageUrl } from '../../config/api';
import BottomNavBar from '../../components/BottomNavBar';

const { width } = Dimensions.get('window');

export default function SmartRecommendationsScreen() {
  const { user } = useContext(AuthContext);
  const { colors } = useContext(ThemeContext);
  const router = useRouter();
  const [recommendations, setRecommendations] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('history');
  const [quantites, setQuantites] = useState({});

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const data = await SmartRecommendationService.getCombinedRecommendations(user.id);
      
      setRecommendations(data);
    } catch (error) {
      console.error('Erreur chargement:', error);
      // En cas d'erreur, charger au moins les parfums tendance
      try {
        const fallbackData = await SmartRecommendationService.getTrendingParfums();
        setRecommendations({
          trending: fallbackData,
          byHistory: fallbackData.slice(0, 3),
          byFavorites: fallbackData.slice(3, 6),
          promotions: fallbackData.slice(0, 4),
          newParfums: fallbackData.slice(4, 8),
        });
      } catch (fallbackError) {
        Alert.alert('Erreur', 'Impossible de charger les recommandations');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (parfum) => {
    try {
      // Utiliser le prix final (avec promotion si applicable)
      const prixFinal = parfum.prix_final || parfum.prix;
      await PanierService.addToPanier(user.id, parfum.id, 1, prixFinal);
      
      const message = parfum.has_active_promotion 
        ? `${parfum.nom} ajouté au panier avec promotion (-${parfum.discount_percentage}%)!`
        : `${parfum.nom} ajouté au panier!`;
      
      Alert.alert('Succès', message);
    } catch (error) {
      console.error('Erreur ajout panier:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter au panier');
    }
  };

  const renderParfumCard = ({ item, index }) => {
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
              <Text style={styles.prix}>
                {item.prix ? String(Math.floor(parseFloat(item.prix))) : '0'}
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
      console.log('Erreur render card:', error);
      return <View style={{ height: 1 }} />;
    }
  };

  const tabs = [
    { id: 'history', label: '📊 Basé sur vos achats', icon: 'bar-chart' },
    { id: 'favorites', label: '❤️ Basé sur vos favoris', icon: 'heart' },
    { id: 'trending', label: '🔥 Tendances', icon: 'flame' },
    { id: 'promotions', label: '💰 Promotions', icon: 'pricetag' },
    { id: 'newParfums', label: '✨ Nouveautés', icon: 'sparkles' },
  ];

  const getActiveData = () => {
    switch (activeTab) {
      case 'history':
        return (recommendations.byHistory || []).filter(item => item && item.id);
      case 'favorites':
        return (recommendations.byFavorites || []).filter(item => item && item.id);
      case 'trending':
        return (recommendations.trending || []).filter(item => item && item.id);
      case 'promotions':
        return (recommendations.promotions || []).filter(item => item && item.id);
      case 'newParfums':
        return (recommendations.newParfums || []).filter(item => item && item.id);
      default:
        return [];
    }
  };

  const activeData = getActiveData();

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
          <Text style={styles.heroIcon}>🎯</Text>
          <Text style={styles.heroTitle}>Recommandations Intelligentes</Text>
          <Text style={styles.heroSubtitle}>Parfums sélectionnés spécialement pour vous</Text>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
        nestedScrollEnabled={true}
        decelerationRate="fast"
      >
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              { backgroundColor: colors.surface, borderColor: colors.border },
              activeTab === tab.id && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[
              styles.tabText,
              { color: colors.text },
              activeTab === tab.id && { color: '#fff', fontWeight: 'bold' },
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      {activeData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.text }]}>Aucune recommandation</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Explorez plus de parfums pour obtenir des recommandations
          </Text>
        </View>
      ) : (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {tabs.find(tab => tab.id === activeTab)?.label || 'Recommandations'}
            </Text>
            <View style={styles.sectionIcon}>
              {activeTab === 'trending' && <Ionicons name="flame" size={20} color="#ff6b6b" />}
              {activeTab === 'newParfums' && <Ionicons name="sparkles" size={20} color="#ffd700" />}
              {activeTab === 'promotions' && <Ionicons name="pricetag" size={20} color="#4caf50" />}
              {activeTab === 'history' && <Ionicons name="bar-chart" size={20} color="#2196f3" />}
              {activeTab === 'favorites' && <Ionicons name="heart" size={20} color="#e91e63" />}
            </View>
          </View>
          
          <FlatList
            data={activeData}
            renderItem={({ item, index }) => renderParfumCard({ item, index })}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.row}
            scrollEnabled={false}
            contentContainerStyle={styles.listContent}
          />
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
    paddingVertical: 35,
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
    fontSize: 48,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 26,
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
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  tabsContent: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    gap: 12,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 2,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
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
  sectionIcon: {
    padding: 5,
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
