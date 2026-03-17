<div align="center">

# 🌹 ParfumsApp

### Application Mobile E-Commerce de Parfums de Luxe

[![React Native](https://img.shields.io/badge/React_Native-0.81.5-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK_54-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)

<br/>

> 🛍️ **Une expérience shopping premium** — Découvrez, explorez et commandez les plus grands parfums de luxe directement depuis votre téléphone.

<br/>

![Version](https://img.shields.io/badge/version-1.0.0-8B4513?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS-lightgrey?style=flat-square)
![License](https://img.shields.io/badge/license-ISC-green?style=flat-square)

</div>

---

## 📋 Table des Matières

- [✨ Fonctionnalités](#-fonctionnalités)
- [🏗️ Architecture](#️-architecture)
- [📁 Structure du Projet](#-structure-du-projet)
- [🚀 Installation](#-installation)
- [⚙️ Configuration](#️-configuration)
- [▶️ Lancement](#️-lancement)
- [📱 Utilisation Mobile](#-utilisation-mobile)
- [🖥️ Interface Admin](#️-interface-admin)
- [🔌 API Reference](#-api-reference)
- [🛠️ Stack Technique](#️-stack-technique)

---

## ✨ Fonctionnalités

### 👤 Authentification
- ✅ Inscription avec validation des champs
- ✅ Connexion sécurisée avec JWT
- ✅ Persistance de session (AsyncStorage)
- ✅ Déconnexion

### 🌹 Catalogue Parfums
- ✅ Liste complète des parfums avec images
- ✅ Filtrage par catégorie (Homme / Femme / Mixte)
- ✅ Recherche par nom ou marque
- ✅ Parfums tendance et nouveautés
- ✅ Parfums similaires

### 🛒 E-Commerce
- ✅ Panier d'achat dynamique
- ✅ Gestion des quantités
- ✅ Promotions et réductions
- ✅ Confirmation de commande
- ✅ Paiement en ligne
- ✅ Historique des commandes

### ❤️ Personnalisation
- ✅ Favoris
- ✅ Wishlist avec priorités
- ✅ Recommandations personnalisées
- ✅ Recommandations intelligentes

### ⭐ Avis & Support
- ✅ Avis sur les parfums (1-5 étoiles)
- ✅ Avis sur les commandes
- ✅ Support client intégré
- ✅ Notifications

### 🎨 Interface
- ✅ Thème clair/sombre
- ✅ Animations fluides
- ✅ Navigation par onglets
- ✅ Design responsive

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    📱 APP MOBILE                         │
│              React Native + Expo SDK 54                  │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Pages   │  │ Services │  │Composants│              │
│  │  /app    │  │/services │  │/components│             │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                          │
│  ┌──────────┐  ┌──────────┐                            │
│  │Contextes │  │  Config  │                            │
│  │/contexts │  │ /config  │                            │
│  └──────────┘  └──────────┘                            │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP / REST API
                      │ WiFi (192.168.11.102:3000)
┌─────────────────────▼───────────────────────────────────┐
│                  💻 BACKEND API                          │
│              Node.js + Express.js                        │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │       
