import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";

import { API_CONFIG } from '../config/api';

const API_URL = API_CONFIG.API_URL;

export default function PaiementEnLigne() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const total = params.total;
  const itemsCount = params.itemsCount;
  const userId = params.userId;
  const commandeData = JSON.parse(params.commandeData || '{}');

  // États pour les informations de carte
  const [numeroCarteComplete, setNumeroCarteComplete] = useState("");
  const [nomTitulaire, setNomTitulaire] = useState("");
  const [dateExpiration, setDateExpiration] = useState("");
  const [cvv, setCvv] = useState("");
  const [loading, setLoading] = useState(false);
  const [etapeValidation, setEtapeValidation] = useState(false);

  // Formatage du numéro de carte
  const formatNumeroCarteComplete = (text) => {
    const cleaned = text.replace(/\s/g, '');
    const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim();
    if (formatted.length <= 19) { // 16 chiffres + 3 espaces
      setNumeroCarteComplete(formatted);
    }
  };

  // Formatage de la date d'expiration
  const formatDateExpiration = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      const formatted = cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
      setDateExpiration(formatted);
    } else {
      setDateExpiration(cleaned);
    }
  };

  // Validation des données de carte
  const validerDonneesCarteComplete = () => {
    if (!numeroCarteComplete || numeroCarteComplete.replace(/\s/g, '').length !== 16) {
      Alert.alert("Erreur", "Numéro de carte invalide (16 chiffres requis)");
      return false;
    }

    if (!nomTitulaire || nomTitulaire.length < 2) {
      Alert.alert("Erreur", "Nom du titulaire requis");
      return false;
    }

    if (!dateExpiration || dateExpiration.length !== 5) {
      Alert.alert("Erreur", "Date d'expiration invalide (MM/AA)");
      return false;
    }

    if (!cvv || cvv.length !== 3) {
      Alert.alert("Erreur", "CVV invalide (3 chiffres requis)");
      return false;
    }

    // Validation de la date d'expiration
    const [mois, annee] = dateExpiration.split('/');
    const dateExp = new Date(2000 + parseInt(annee), parseInt(mois) - 1);
    const maintenant = new Date();
    
    if (dateExp < maintenant) {
      Alert.alert("Erreur", "Carte expirée");
      return false;
    }

    return true;
  };

  // Simulation du paiement
  const processerPaiement = async () => {
    if (!validerDonneesCarteComplete()) return;

    try {
      setLoading(true);
      setEtapeValidation(true);

      // Simulation d'un délai de traitement
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Simulation d'un taux de succès de 90%
      const succes = Math.random() > 0.1;

      if (!succes) {
        throw new Error("Paiement refusé par la banque");
      }

      // Créer la commande avec paiement validé
      const res = await fetch(`${API_URL}/achat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...commandeData,
          user_id: Number(userId),
          mode_paiement: "enligne",
          paiement_valide: true,
          transaction_id: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `Erreur ${res.status}`);
      }

      Alert.alert(
        "Paiement réussi ! 🎉",
        `Merci ${commandeData.nom} !\n\nPaiement de ${total} DH validé\nTransaction: TXN_${Date.now().toString().slice(-6)}\n\nVotre commande sera livrée sous 2-3 jours ouvrables.`,
        [
          {
            text: "Voir mes commandes",
            onPress: () => router.push("/(tabs)/MesCommandes"),
          },
          {
            text: "Retour à l'accueil",
            onPress: () => router.push("/(tabs)/accueil"),
          },
        ]
      );

    } catch (err) {
      console.error("[PaiementEnLigne] Erreur:", err);
      Alert.alert(
        "Paiement échoué ❌", 
        err.message || "Erreur lors du traitement du paiement",
        [
          {
            text: "Réessayer",
            onPress: () => setEtapeValidation(false)
          },
          {
            text: "Annuler",
            onPress: () => router.back()
          }
        ]
      );
    } finally {
      setLoading(false);
      setEtapeValidation(false);
    }
  };

  // Détection du type de carte
  const getTypeCarteComplete = (numero) => {
    const cleaned = numero.replace(/\s/g, '');
    if (cleaned.startsWith('4')) return { type: 'Visa', icon: '💳' };
    if (cleaned.startsWith('5')) return { type: 'Mastercard', icon: '💳' };
    if (cleaned.startsWith('3')) return { type: 'American Express', icon: '💳' };
    return { type: 'Carte bancaire', icon: '💳' };
  };

  const typeCarteComplete = getTypeCarteComplete(numeroCarteComplete);

  if (etapeValidation) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#28a745" />
          <Text style={styles.loadingTitle}>Traitement du paiement...</Text>
          <Text style={styles.loadingText}>Veuillez patienter</Text>
          <Text style={styles.loadingAmount}>{total} DH</Text>
          <View style={styles.securityInfo}>
            <Text style={styles.securityText}>🔒 Paiement sécurisé</Text>
            <Text style={styles.securityText}>🛡️ Données cryptées</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>💳 Paiement en ligne</Text>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>Articles: {itemsCount}</Text>
          <Text style={styles.summaryTotal}>Total: {total} DH</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💳 Informations de carte</Text>
        
        <Text style={styles.label}>Numéro de carte *</Text>
        <View style={styles.cardInputContainer}>
          <TextInput
            style={styles.cardInput}
            placeholder="1234 5678 9012 3456"
            value={numeroCarteComplete}
            onChangeText={formatNumeroCarteComplete}
            keyboardType="numeric"
            maxLength={19}
          />
          <Text style={styles.cardType}>{typeCarteComplete.icon} {typeCarteComplete.type}</Text>
        </View>

        <Text style={styles.label}>Nom du titulaire *</Text>
        <TextInput
          style={styles.input}
          placeholder="AHMED BENALI"
          value={nomTitulaire}
          onChangeText={setNomTitulaire}
          autoCapitalize="characters"
        />

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Date d'expiration *</Text>
            <TextInput
              style={styles.input}
              placeholder="MM/AA"
              value={dateExpiration}
              onChangeText={formatDateExpiration}
              keyboardType="numeric"
              maxLength={5}
            />
          </View>
          
          <View style={styles.halfInput}>
            <Text style={styles.label}>CVV *</Text>
            <TextInput
              style={styles.input}
              placeholder="123"
              value={cvv}
              onChangeText={setCvv}
              keyboardType="numeric"
              maxLength={3}
              secureTextEntry
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Récapitulatif</Text>
        <View style={styles.recapCard}>
          <View style={styles.recapRow}>
            <Text style={styles.recapLabel}>Livraison à:</Text>
            <Text style={styles.recapValue}>{commandeData.nom}</Text>
          </View>
          <View style={styles.recapRow}>
            <Text style={styles.recapLabel}>Adresse:</Text>
            <Text style={styles.recapValue}>{commandeData.adresse}, {commandeData.ville}</Text>
          </View>
          <View style={styles.recapRow}>
            <Text style={styles.recapLabel}>Articles:</Text>
            <Text style={styles.recapValue}>{itemsCount} produit(s)</Text>
          </View>
          <View style={[styles.recapRow, styles.recapTotal]}>
            <Text style={styles.recapTotalLabel}>Total à payer:</Text>
            <Text style={styles.recapTotalValue}>{total} DH</Text>
          </View>
        </View>
      </View>

      
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonTextSecondary}>← Changer le mode de paiement</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary, loading && styles.buttonDisabled]}
          onPress={processerPaiement}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonTextPrimary}>💳 Payer {total} DH</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingCard: {
    backgroundColor: "#fff",
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
    margin: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: "#333",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 15,
  },
  loadingAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#28a745",
    marginBottom: 20,
  },
  securityInfo: {
    alignItems: "center",
  },
  securityText: {
    fontSize: 14,
    color: "#28a745",
    marginBottom: 5,
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: "#28a745",
    fontWeight: "600",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
  },
  summaryCard: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryText: {
    fontSize: 16,
    color: "#666",
  },
  summaryTotal: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#28a745",
  },
  section: {
    backgroundColor: "#fff",
    padding: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  cardInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  cardInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  cardType: {
    paddingRight: 12,
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    gap: 15,
  },
  halfInput: {
    flex: 1,
  },
  recapCard: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
  },
  recapRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  recapLabel: {
    fontSize: 14,
    color: "#666",
  },
  recapValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    textAlign: "right",
  },
  recapTotal: {
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingTop: 10,
    marginTop: 10,
  },
  recapTotalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  recapTotalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#28a745",
  },
  securitySection: {
    backgroundColor: "#e8f5e8",
    padding: 20,
    margin: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#28a745",
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#28a745",
    marginBottom: 8,
  },
  securityDesc: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    gap: 10,
    marginBottom: 120,
  },
  button: {
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonPrimary: {
    backgroundColor: "#28a745",
  },
  buttonSecondary: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#28a745",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonTextPrimary: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonTextSecondary: {
    color: "#28a745",
    fontSize: 16,
    fontWeight: "bold",
  },
});