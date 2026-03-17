// ===================== IMPORTS =====================
import 'dotenv/config';
import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import bcrypt from 'bcrypt';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// Utilisation d'un pool de connexions pour plus de stabilité
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'parfums',
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  idleTimeout: 300000,
  queueLimit: 0
});

// Test de connexion
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Erreur MySQL:', err.message);
    process.exit(1);
  }
  console.log('✅ Connecté à MySQL - Base:', process.env.DB_NAME || 'parfums');
  connection.release();
});

// ============================================
// ROUTES D'AUTHENTIFICATION
// ============================================

app.get('/', (req, res) => {
  res.json({ 
    message: '✅ API Parfums fonctionnelle',
    database: db.config.database,
    routes: {
      register: 'POST /api/register',
      login: 'POST /api/login',
      parfums: 'GET /api/parfums',
      panier: 'GET/POST/DELETE /api/panier',
      favoris: 'GET/POST/DELETE /api/favoris',
      commandes: 'GET /api/commandes/:userId',
      achat: 'POST /api/achat',
      promotions: 'GET/POST/DELETE /api/admin/promotions'
    }
  });
});

// Route temporaire pour ajouter la colonne prix_unitaire au panier
app.get('/api/add-prix-unitaire-column', (req, res) => {
  const addColumnQuery = `
    ALTER TABLE panier 
    ADD COLUMN IF NOT EXISTS prix_unitaire DECIMAL(10, 2) DEFAULT NULL
  `;
  
  db.query(addColumnQuery, (err) => {
    if (err) {
      console.log('⚠️ Colonne prix_unitaire déjà présente ou erreur:', err.message);
    }
    res.json({ success: true, message: 'Colonne prix_unitaire ajoutée au panier' });
  });
});

// Route temporaire pour ajouter la colonne categorie
app.get('/api/add-categorie-column', (req, res) => {
  const addColumnQuery = `
    ALTER TABLE parfums 
    ADD COLUMN IF NOT EXISTS categorie ENUM('homme', 'femme', 'mixte') DEFAULT 'mixte'
  `;
  
  db.query(addColumnQuery, (err) => {
    if (err) {
      console.log('⚠️ Colonne categorie déjà présente ou erreur:', err.message);
    }
    
    // Mettre à jour quelques parfums avec des catégories
    const updateQuery = `
      UPDATE parfums 
      SET categorie = CASE 
        WHEN id % 3 = 0 THEN 'homme'
        WHEN id % 3 = 1 THEN 'femme'
        ELSE 'mixte'
      END
      WHERE categorie IS NULL OR categorie = 'mixte'
    `;
    
    db.query(updateQuery, (err) => {
      if (err) {
        console.log('⚠️ Erreur mise à jour catégories:', err.message);
      }
      res.json({ success: true, message: 'Colonne categorie ajoutée et parfums mis à jour' });
    });
  });
});

// Route temporaire pour ajouter la colonne téléphone aux users
app.get('/api/add-telephone-column', (req, res) => {
  const addColumnQuery = `
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS telephone VARCHAR(20) DEFAULT NULL
  `;
  
  db.query(addColumnQuery, (err) => {
    if (err) {
      console.log('⚠️ Colonne telephone déjà présente ou erreur:', err.message);
    }
    
    // Maintenant, essayons de récupérer les numéros de téléphone depuis les commandes
    const updateQuery = `
      UPDATE users u
      JOIN (
        SELECT user_id, telephone 
        FROM commandes 
        WHERE telephone IS NOT NULL AND telephone != ''
        GROUP BY user_id
      ) c ON u.id = c.user_id
      SET u.telephone = c.telephone
      WHERE u.telephone IS NULL OR u.telephone = ''
    `;
    
    db.query(updateQuery, (err, result) => {
      if (err) {
        console.log('⚠️ Erreur mise à jour téléphones:', err.message);
      } else {
        console.log('✅ Téléphones mis à jour pour', result.affectedRows, 'utilisateurs');
      }
      res.json({ 
        success: true, 
        message: 'Colonne telephone ajoutée aux users et numéros récupérés depuis les commandes',
        updated: result?.affectedRows || 0
      });
    });
  });
});

// Route temporaire pour créer la table wishlist
app.get('/api/init-wishlist', (req, res) => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS wishlist (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      parfum_id INT NOT NULL,
      date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      note_personnelle TEXT,
      priorite ENUM('basse', 'moyenne', 'haute') DEFAULT 'moyenne',
      UNIQUE KEY unique_wishlist (user_id, parfum_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (parfum_id) REFERENCES parfums(id) ON DELETE CASCADE
    )
  `;
  
  db.query(createTableQuery, (err) => {
    if (err) {
      console.error('❌ Erreur création table wishlist:', err);
      return res.status(500).json({ success: false, message: 'Erreur création table' });
    }
    res.json({ success: true, message: 'Table wishlist créée avec succès' });
  });
});

// Route temporaire pour créer la table avis
app.get('/api/init-avis', (req, res) => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS avis (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      parfum_id INT NOT NULL,
      commande_id INT,
      note INT NOT NULL CHECK (note >= 1 AND note <= 5),
      commentaire TEXT,
      date_avis TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (parfum_id) REFERENCES parfums(id) ON DELETE CASCADE,
      FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE SET NULL
    )
  `;
  
  db.query(createTableQuery, (err) => {
    if (err) {
      console.error('❌ Erreur création table avis:', err);
      return res.status(500).json({ success: false, message: 'Erreur création table' });
    }
    res.json({ success: true, message: 'Table avis créée avec succès' });
  });
});

// Route temporaire pour créer la table order_items
app.get('/api/init-order-items', (req, res) => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS order_items (
      id INT PRIMARY KEY AUTO_INCREMENT,
      commande_id INT NOT NULL,
      parfum_id INT NOT NULL,
      parfum_nom VARCHAR(255) NOT NULL,
      parfum_marque VARCHAR(255) NOT NULL,
      parfum_image_url VARCHAR(255),
      prix_unitaire DECIMAL(10, 2) NOT NULL,
      quantite INT NOT NULL DEFAULT 1,
      total_item DECIMAL(10, 2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE,
      FOREIGN KEY (parfum_id) REFERENCES parfums(id)
    )
  `;
  
  db.query(createTableQuery, (err) => {
    if (err) {
      console.error('❌ Erreur création table order_items:', err);
      return res.status(500).json({ success: false, message: 'Erreur création table' });
    }
    res.json({ success: true, message: 'Table order_items créée avec succès' });
  });
});

// Route temporaire pour créer la table promotions
app.get('/api/init-promotions', (req, res) => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS promotions (
      id INT PRIMARY KEY AUTO_INCREMENT,
      parfum_id INT NOT NULL,
      discount_percentage INT NOT NULL CHECK (discount_percentage >= 1 AND discount_percentage <= 90),
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      description TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parfum_id) REFERENCES parfums(id) ON DELETE CASCADE
    )
  `;
  
  db.query(createTableQuery, (err) => {
    if (err) {
      console.error('❌ Erreur création table promotions:', err);
      return res.status(500).json({ success: false, message: 'Erreur création table' });
    }
    
    // Insérer des données d'exemple
    const insertQuery = `
      INSERT IGNORE INTO promotions (parfum_id, discount_percentage, start_date, end_date, description, is_active) VALUES
      (1, 20, '2025-12-13', '2025-12-31', 'Promotion de fin d\'année', 1),
      (2, 15, '2025-12-13', '2025-12-25', 'Promotion de Noël', 1),
      (3, 30, '2025-12-13', '2025-12-20', 'Promotion flash', 1)
    `;
    
    db.query(insertQuery, (err) => {
      if (err) {
        console.log('⚠️ Données d\'exemple déjà présentes ou erreur:', err.message);
      }
      res.json({ success: true, message: 'Table promotions créée et initialisée' });
    });
  });
});

// Route temporaire pour créer la table avis_commandes_simple
app.get('/api/init-avis-commandes-simple', (req, res) => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS avis_commandes_simple (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      commande_id INT NOT NULL,
      note INT CHECK (note >= 1 AND note <= 5),
      commentaire TEXT,
      date_avis TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (commande_id) REFERENCES commandes(id)
    )
  `;
  
  db.query(createTableQuery, (err) => {
    if (err) {
      console.error('❌ Erreur création table avis_commandes_simple:', err);
      return res.status(500).json({ success: false, message: 'Erreur création table' });
    }
    res.json({ success: true, message: 'Table avis_commandes_simple créée avec succès' });
  });
});

// Route temporaire pour ajouter les colonnes de paiement en ligne
app.get('/api/init-paiement-enligne', (req, res) => {
  const addColumnsQuery = `
    ALTER TABLE commandes 
    ADD COLUMN IF NOT EXISTS paiement_valide BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255)
  `;
  
  db.query(addColumnsQuery, (err) => {
    if (err) {
      console.log('⚠️ Colonnes paiement déjà présentes ou erreur:', err.message);
    }
    res.json({ success: true, message: 'Colonnes paiement en ligne ajoutées' });
  });
});

app.post('/api/register', async (req, res) => {
  console.log('📝 Tentative inscription:', req.body);
  
  const { nom, email, mot_de_passe } = req.body;

  if (!nom || !email || !mot_de_passe) {
    return res.status(400).json({ 
      success: false, 
      message: 'Tous les champs sont requis' 
    });
  }

  try {
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Erreur serveur' });
      }

      if (results.length > 0) {
        return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé' });
      }

      const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
      const query = 'INSERT INTO users (nom, email, mot_de_passe) VALUES (?, ?, ?)';
      
      db.query(query, [nom, email, hashedPassword], (err, result) => {
        if (err) {
          return res.status(500).json({ success: false, message: 'Erreur lors de la création du compte' });
        }

        res.status(201).json({ 
          success: true, 
          message: 'Compte créé avec succès',
          userId: result.insertId
        });
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

app.post('/api/login', (req, res) => {
  const { email, mot_de_passe } = req.body;

  if (!email || !mot_de_passe) {
    return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
  }

  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], async (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    if (results.length === 0) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    const user = results[0];
    const isPasswordValid = await bcrypt.compare(mot_de_passe, user.mot_de_passe);

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    const { mot_de_passe: _, ...userWithoutPassword } = user;
    res.json({ success: true, message: 'Connexion réussie', user: userWithoutPassword });
  });
});

// ============================================
// ROUTES PARFUMS
// ============================================

app.get('/api/parfums', (req, res) => {
  const { categorie } = req.query;
  let query = `
    SELECT 
      p.*,
      best_promo.promotion_id,
      best_promo.discount_percentage,
      best_promo.start_date,
      best_promo.end_date,
      best_promo.promo_description,
      CASE 
        WHEN best_promo.promotion_id IS NOT NULL
        THEN ROUND(CAST(p.prix AS DECIMAL(10,2)) * (1 - CAST(best_promo.discount_percentage AS DECIMAL(5,2)) / 100), 2)
        ELSE CAST(p.prix AS DECIMAL(10,2))
      END as prix_final,
      CASE 
        WHEN best_promo.promotion_id IS NOT NULL
        THEN 1 ELSE 0
      END as has_active_promotion
    FROM parfums p
    LEFT JOIN (
      SELECT 
        parfum_id,
        id as promotion_id,
        discount_percentage,
        start_date,
        end_date,
        description as promo_description,
        ROW_NUMBER() OVER (PARTITION BY parfum_id ORDER BY discount_percentage DESC) as rn
      FROM promotions 
      WHERE is_active = 1 
        AND CURDATE() BETWEEN start_date AND end_date
    ) best_promo ON p.id = best_promo.parfum_id AND best_promo.rn = 1
    WHERE p.stock > 0
  `;
  
  let params = [];
  if (categorie && ['homme', 'femme', 'mixte'].includes(categorie)) {
    query += ' AND p.categorie = ?';
    params.push(categorie);
  }
  
  query += ' ORDER BY p.id DESC';
  
  db.query(query, params, (err, results) => {
    if (err) {
      console.error('❌ Erreur SQL parfums:', err);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
    res.json(results);
  });
});

app.get('/api/parfums/new', (req, res) => {
  const query = `
    SELECT 
      p.*,
      NULL as promotion_id,
      NULL as discount_percentage,
      NULL as start_date,
      NULL as end_date,
      NULL as promo_description,
      CAST(p.prix AS DECIMAL(10,2)) as prix_final,
      0 as has_active_promotion
    FROM parfums p
    WHERE p.stock > 0 
      AND p.id NOT IN (
        SELECT DISTINCT parfum_id 
        FROM promotions 
        WHERE is_active = 1 
          AND CURDATE() BETWEEN start_date AND end_date
      )
    ORDER BY p.id DESC 
    LIMIT 10
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Erreur SQL new parfums:', err);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
    res.json(results);
  });
});

app.get('/api/parfums/trending', (req, res) => {
  // Parfums tendance = ceux avec le moins de stock (plus vendus)
  const query = `
    SELECT 
      p.*,
      best_promo.promotion_id,
      best_promo.discount_percentage,
      best_promo.start_date,
      best_promo.end_date,
      best_promo.promo_description,
      CASE 
        WHEN best_promo.promotion_id IS NOT NULL
        THEN ROUND(CAST(p.prix AS DECIMAL(10,2)) * (1 - CAST(best_promo.discount_percentage AS DECIMAL(5,2)) / 100), 2)
        ELSE CAST(p.prix AS DECIMAL(10,2))
      END as prix_final,
      CASE 
        WHEN best_promo.promotion_id IS NOT NULL
        THEN 1 ELSE 0
      END as has_active_promotion,
      (100 - p.stock) as popularity_score
    FROM parfums p
    LEFT JOIN (
      SELECT 
        parfum_id,
        id as promotion_id,
        discount_percentage,
        start_date,
        end_date,
        description as promo_description,
        ROW_NUMBER() OVER (PARTITION BY parfum_id ORDER BY discount_percentage DESC) as rn
      FROM promotions 
      WHERE is_active = 1 
        AND CURDATE() BETWEEN start_date AND end_date
    ) best_promo ON p.id = best_promo.parfum_id AND best_promo.rn = 1
    WHERE p.stock > 0
    ORDER BY popularity_score DESC, p.id DESC
    LIMIT 8
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Erreur SQL trending:', err);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
    res.json(results);
  });
});

app.get('/api/parfums/promotions', (req, res) => {
  const query = 'SELECT * FROM parfums WHERE stock > 0 ORDER BY prix ASC LIMIT 8';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
    res.json(results);
  });
});

app.get('/api/parfums/similaires/:parfumId', (req, res) => {
  const { parfumId } = req.params;
  const query = 'SELECT * FROM parfums WHERE stock > 0 AND id != ? ORDER BY RAND() LIMIT 5';
  db.query(query, [parfumId], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
    res.json(results);
  });
});

// ============================================
// ROUTES ADMIN - PARFUMS
// ============================================

// Configuration multer pour l'upload d'images

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'));
    }
  }
});

app.post('/api/admin/parfums', upload.single('image'), (req, res) => {
  const { nom, marque, categorie, prix, stock, description } = req.body;

  // Debug logging
  console.log('📝 Données reçues:', { nom, marque, categorie, prix, stock, description });

  if (!nom || !marque || !categorie || prix === undefined || prix === null || stock === undefined || stock === null) {
    return res.status(400).json({ success: false, message: 'Données manquantes (nom, marque, catégorie, prix, stock requis)' });
  }

  if (!['femme', 'homme', 'mixte'].includes(categorie)) {
    return res.status(400).json({ success: false, message: 'Catégorie invalide (femme, homme, ou mixte)' });
  }

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  
  const query = 'INSERT INTO parfums (nom, marque, categorie, prix, stock, description, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.query(query, [nom, marque, categorie, prix, stock, description || null, imageUrl], (err, result) => {
    if (err) {
      console.error('Erreur insert parfum:', err);
      return res.status(500).json({ success: false, message: 'Erreur lors de la création: ' + err.message });
    }
    res.json({ 
      success: true, 
      message: 'Parfum créé avec succès', 
      id: result.insertId,
      imageUrl: imageUrl 
    });
  });
});

app.put('/api/admin/parfums/:id', upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { nom, marque, categorie, prix, stock, description } = req.body;

  console.log('🔄 Mise à jour parfum #' + id, { nom, marque, categorie, prix, stock, description });

  if (!nom || !marque || !categorie || prix === undefined || prix === null || stock === undefined || stock === null) {
    return res.status(400).json({ success: false, message: 'Données manquantes (nom, marque, catégorie, prix, stock requis)' });
  }

  if (!['femme', 'homme', 'mixte'].includes(categorie)) {
    return res.status(400).json({ success: false, message: 'Catégorie invalide (femme, homme, ou mixte)' });
  }

  // Construire la requête dynamiquement selon si une image est fournie
  let query, params;
  
  if (req.file) {
    // Avec nouvelle image
    const imageUrl = `/uploads/${req.file.filename}`;
    query = 'UPDATE parfums SET nom = ?, marque = ?, categorie = ?, prix = ?, stock = ?, description = ?, image_url = ? WHERE id = ?';
    params = [nom, marque, categorie, prix, stock, description || null, imageUrl, id];
  } else {
    // Sans nouvelle image
    query = 'UPDATE parfums SET nom = ?, marque = ?, categorie = ?, prix = ?, stock = ?, description = ? WHERE id = ?';
    params = [nom, marque, categorie, prix, stock, description || null, id];
  }

  db.query(query, params, (err) => {
    if (err) {
      console.error('Erreur update parfum:', err);
      return res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour: ' + err.message });
    }
    res.json({ 
      success: true, 
      message: 'Parfum mis à jour avec succès',
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null
    });
  });
});

app.delete('/api/admin/parfums/:id', (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM parfums WHERE id = ?';
  db.query(query, [id], (err) => {
    if (err) {
      console.error('Erreur delete parfum:', err);
      return res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
    }
    res.json({ success: true, message: 'Parfum supprimé' });
  });
});

// ============================================
// ROUTES ADMIN - COMMANDES
// ============================================

// Récupérer toutes les commandes pour l'admin avec filtrage
app.get('/api/admin/orders', (req, res) => {
  const { dateFrom, dateTo, statut } = req.query;
  
  let query = `
    SELECT 
      c.*,
      u.nom as user_nom,
      u.email as user_email
    FROM commandes c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE 1=1
  `;
  
  const params = [];
  
  // Filtrage par date de début
  if (dateFrom) {
    query += ' AND DATE(c.date_commande) >= ?';
    params.push(dateFrom);
  }
  
  // Filtrage par date de fin
  if (dateTo) {
    query += ' AND DATE(c.date_commande) <= ?';
    params.push(dateTo);
  }
  
  // Filtrage par statut
  if (statut && statut !== 'all') {
    query += ' AND c.statut = ?';
    params.push(statut);
  }
  
  query += ' ORDER BY c.date_commande DESC';
  
  console.log('🔍 Filtrage commandes:', { dateFrom, dateTo, statut });
  console.log('🔍 Requête SQL:', query);
  console.log('🔍 Paramètres SQL:', params);
  
  db.query(query, params, (err, results) => {
    if (err) {
      console.error('❌ Erreur SQL commandes admin:', err);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
    console.log('✅ Commandes filtrées:', results.length);
    if (results.length > 0) {
      console.log('📋 Première commande:', {
        id: results[0].id,
        date: results[0].date_commande,
        statut: results[0].statut
      });
    }
    res.json(results);
  });
});

// Récupérer les détails d'une commande avec les parfums commandés
app.get('/api/admin/orders/:id/details', (req, res) => {
  const { id } = req.params;
  
  // D'abord récupérer les infos de la commande
  const orderQuery = `
    SELECT 
      c.*,
      u.nom as user_nom,
      u.email as user_email
    FROM commandes c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `;
  
  db.query(orderQuery, [id], (err, orderResults) => {
    if (err) {
      console.error('❌ Erreur SQL commande details:', err);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
    
    if (orderResults.length === 0) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }
    
    const order = orderResults[0];
    
    // Maintenant récupérer les items de la commande
    const itemsQuery = `
      SELECT 
        oi.*,
        p.image_url as current_image_url
      FROM order_items oi
      LEFT JOIN parfums p ON oi.parfum_id = p.id
      WHERE oi.commande_id = ?
      ORDER BY oi.id
    `;
    
    db.query(itemsQuery, [id], (err, itemsResults) => {
      if (err) {
        console.error('❌ Erreur SQL items commande:', err);
        return res.status(500).json({ success: false, message: 'Erreur serveur items' });
      }
      
      res.json({
        success: true,
        order: order,
        items: itemsResults
      });
    });
  });
});

// Récupérer tous les utilisateurs pour l'admin
app.get('/api/admin/users', (req, res) => {
  // D'abord, essayons d'ajouter la colonne date_creation si elle n'existe pas
  const addColumnQuery = `
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  `;
  
  db.query(addColumnQuery, (err) => {
    if (err) {
      console.log('⚠️ Colonne date_creation déjà présente ou erreur:', err.message);
    }
    
    // Maintenant la requête principale
    const query = `
      SELECT 
        u.id,
        u.nom,
        u.email,
        u.telephone,
        COALESCE(COUNT(c.id), 0) as orders_count,
        COALESCE(SUM(c.total), 0.00) as total_spent
      FROM users u
      LEFT JOIN commandes c ON u.id = c.user_id
      GROUP BY u.id, u.nom, u.email, u.telephone
      ORDER BY u.id DESC
    `;
    
    db.query(query, (err, results) => {
      if (err) {
        console.error('❌ Erreur SQL users admin:', err);
        return res.status(500).json({ success: false, message: 'Erreur serveur: ' + err.message });
      }
      console.log('✅ Users récupérés:', results.length);
      if (results.length > 0) {
        console.log('📋 Premier utilisateur complet:', results[0]);
      }
      res.json(results);
    });
  });
});

// Récupérer les détails d'un utilisateur spécifique
app.get('/api/admin/users/:id', (req, res) => {
  const { id } = req.params;
  
  // Récupérer les infos de l'utilisateur
  const userQuery = `
    SELECT 
      u.id,
      u.nom,
      u.email,
      u.telephone,
      COALESCE(COUNT(c.id), 0) as orders_count,
      COALESCE(SUM(c.total), 0.00) as total_spent
    FROM users u
    LEFT JOIN commandes c ON u.id = c.user_id
    WHERE u.id = ?
    GROUP BY u.id, u.nom, u.email, u.telephone
  `;
  
  db.query(userQuery, [id], (err, userResults) => {
    if (err) {
      console.error('❌ Erreur SQL user details:', err);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
    
    if (userResults.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    
    const user = userResults[0];
    
    // Récupérer l'historique des commandes
    const ordersQuery = `
      SELECT 
        c.*,
        COUNT(oi.id) as items_count
      FROM commandes c
      LEFT JOIN order_items oi ON c.id = oi.commande_id
      WHERE c.user_id = ?
      GROUP BY c.id
      ORDER BY c.date_commande DESC
      LIMIT 10
    `;
    
    db.query(ordersQuery, [id], (err, ordersResults) => {
      if (err) {
        console.error('❌ Erreur SQL user orders:', err);
        return res.status(500).json({ success: false, message: 'Erreur serveur orders' });
      }
      
      res.json({
        success: true,
        user: user,
        orders: ordersResults
      });
    });
  });
});

app.put('/api/admin/commandes/:id', (req, res) => {
  const { id } = req.params;
  const { statut } = req.body;

  if (!statut) {
    return res.status(400).json({ success: false, message: 'Statut manquant' });
  }

  const query = 'UPDATE commandes SET statut = ? WHERE id = ?';
  db.query(query, [statut, id], (err) => {
    if (err) {
      console.error('Erreur update commande:', err);
      return res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour' });
    }
    res.json({ success: true, message: 'Commande mise à jour' });
  });
});

app.get('/api/recommendations/purchase-history/:userId', (req, res) => {
  const { userId } = req.params;
  const query = `
    SELECT DISTINCT p.* FROM parfums p
    JOIN panier pan ON p.id = pan.parfum_id
    WHERE pan.user_id = ?
    AND p.stock > 0
    ORDER BY RAND() LIMIT 5
  `;
  db.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
    res.json(results || []);
  });
});

app.get('/api/recommendations/favorites/:userId', (req, res) => {
  const { userId } = req.params;
  const query = `
    SELECT DISTINCT p.* FROM parfums p
    JOIN favoris f ON p.id = f.parfum_id
    WHERE f.user_id = ?
    AND p.stock > 0
    ORDER BY RAND() LIMIT 5
  `;
  db.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
    res.json(results || []);
  });
});

// ============================================
// ROUTES FAVORIS (NOUVELLES)
// ============================================

// Récupérer les favoris d'un utilisateur
app.get('/api/favoris/:userId', (req, res) => {
  const { userId } = req.params;
  console.log('❤️ Récupération favoris pour user:', userId);

  const query = `
    SELECT 
      favoris.id AS favori_id,
      parfums.*
    FROM favoris
    JOIN parfums ON favoris.parfum_id = parfums.id
    WHERE favoris.user_id = ?
    ORDER BY favoris.created_at DESC
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('❌ Erreur SQL:', err);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
    console.log(`✅ ${results.length} favoris récupérés`);
    res.json(results);
  });
});

// Ajouter aux favoris
app.post('/api/favoris', (req, res) => {
  const { user_id, parfum_id } = req.body;
  console.log('➕ Ajout aux favoris:', { user_id, parfum_id });

  if (!user_id || !parfum_id) {
    return res.status(400).json({ success: false, message: 'Données manquantes' });
  }

  const query = 'INSERT INTO favoris (user_id, parfum_id) VALUES (?, ?)';
  db.query(query, [user_id, parfum_id], (err) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, message: 'Déjà dans les favoris' });
      }
      console.error('❌ Erreur insert:', err);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    console.log('✅ Ajouté aux favoris');
    res.json({ success: true, message: 'Ajouté aux favoris' });
  });
});

// Retirer des favoris
app.delete('/api/favoris/:userId/:parfumId', (req, res) => {
  const { userId, parfumId } = req.params;
  console.log('🗑️ Suppression favori:', { userId, parfumId });

  const query = 'DELETE FROM favoris WHERE user_id = ? AND parfum_id = ?';
  db.query(query, [userId, parfumId], (err, result) => {
    if (err) {
      console.error('❌ Erreur SQL:', err);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    console.log('✅ Favori supprimé');
    res.json({ success: true, message: 'Retiré des favoris' });
  });
});

// Vérifier si un parfum est favori
app.get('/api/favoris/:userId/:parfumId', (req, res) => {
  const { userId, parfumId } = req.params;

  const query = 'SELECT id FROM favoris WHERE user_id = ? AND parfum_id = ?';
  db.query(query, [userId, parfumId], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
    res.json({ isFavorite: results.length > 0 });
  });
});

// ============================================
// ROUTES PANIER
// ============================================

app.get('/api/panier/:userId', (req, res) => {
  const { userId } = req.params;

  const query = `
    SELECT 
      panier.id AS panier_id,
      panier.parfum_id,
      panier.quantite,
      COALESCE(panier.prix_unitaire, parfums.prix) as prix_unitaire,
      parfums.nom,
      parfums.marque,
      parfums.prix as prix_original,
      parfums.image_url,
      (
        SELECT MAX(discount_percentage) 
        FROM promotions 
        WHERE parfum_id = parfums.id 
          AND is_active = 1 
          AND CURDATE() BETWEEN start_date AND end_date
      ) as discount_percentage,
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM promotions 
          WHERE parfum_id = parfums.id 
            AND is_active = 1 
            AND CURDATE() BETWEEN start_date AND end_date
        )
        THEN 1 ELSE 0
      END as has_active_promotion
    FROM panier
    JOIN parfums ON panier.parfum_id = parfums.id
    WHERE panier.user_id = ?
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('❌ Erreur SQL panier:', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    res.json(results);
  });
});

app.post('/api/panier', (req, res) => {
  const { user_id, parfum_id, quantite, prix_unitaire } = req.body;

  if (!user_id || !parfum_id || !quantite) {
    return res.status(400).json({ success: false, message: 'Données manquantes' });
  }

  // Vérifier le prix promotionnel actuel (meilleure promotion)
  const getPriceQuery = `
    SELECT 
      p.prix,
      CASE 
        WHEN best_promo.promotion_id IS NOT NULL
        THEN ROUND(CAST(p.prix AS DECIMAL(10,2)) * (1 - CAST(best_promo.discount_percentage AS DECIMAL(5,2)) / 100), 2)
        ELSE CAST(p.prix AS DECIMAL(10,2))
      END as prix_final
    FROM parfums p
    LEFT JOIN (
      SELECT 
        parfum_id,
        id as promotion_id,
        discount_percentage,
        ROW_NUMBER() OVER (PARTITION BY parfum_id ORDER BY discount_percentage DESC) as rn
      FROM promotions 
      WHERE is_active = 1 
        AND CURDATE() BETWEEN start_date AND end_date
    ) best_promo ON p.id = best_promo.parfum_id AND best_promo.rn = 1
    WHERE p.id = ?
  `;

  db.query(getPriceQuery, [parfum_id], (err, priceResults) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    const currentPrice = priceResults[0]?.prix_final || prix_unitaire;

    const checkQuery = 'SELECT * FROM panier WHERE user_id = ? AND parfum_id = ?';
    db.query(checkQuery, [user_id, parfum_id], (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Erreur serveur' });
      }

      if (results.length > 0) {
        const updateQuery = 'UPDATE panier SET quantite = quantite + ?, prix_unitaire = ? WHERE user_id = ? AND parfum_id = ?';
        db.query(updateQuery, [quantite, currentPrice, user_id, parfum_id], (err) => {
          if (err) {
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
          }
          res.json({ success: true, message: 'Quantité mise à jour avec prix promotionnel' });
        });
      } else {
        const insertQuery = 'INSERT INTO panier (user_id, parfum_id, quantite, prix_unitaire) VALUES (?, ?, ?, ?)';
        db.query(insertQuery, [user_id, parfum_id, quantite, currentPrice], (err) => {
          if (err) {
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
          }
          res.json({ success: true, message: 'Produit ajouté au panier avec prix promotionnel' });
        });
      }
    });
  });
});

app.delete('/api/panier/:id', (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM panier WHERE id = ?';
  db.query(query, [id], (err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
    res.json({ success: true, message: 'Produit retiré du panier' });
  });
});

// ============================================
// ROUTES COMMANDES
// ============================================

app.get('/api/commandes/:userId', (req, res) => {
  const { userId } = req.params;

  const query = 'SELECT * FROM commandes WHERE user_id = ? ORDER BY date_commande DESC';
  db.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
    res.json(results);
  });
});

// Annuler une commande (côté utilisateur)
app.delete('/api/commandes/:userId/:commandeId', (req, res) => {
  const { userId, commandeId } = req.params;

  // Vérifier que la commande appartient à l'utilisateur et qu'elle peut être annulée
  const checkQuery = `
    SELECT statut FROM commandes 
    WHERE id = ? AND user_id = ?
  `;

  db.query(checkQuery, [commandeId, userId], (err, results) => {
    if (err) {
      console.error('❌ Erreur vérification commande:', err);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }

    const commande = results[0];
    
    // Vérifier si la commande peut être annulée
    if (commande.statut === 'en_cours' || commande.statut === 'livree') {
      return res.status(400).json({ 
        success: false, 
        message: 'Impossible d\'annuler une commande en cours de livraison ou déjà livrée' 
      });
    }

    if (commande.statut === 'annulee') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cette commande est déjà annulée' 
      });
    }

    // Supprimer la commande et ses items
    const deleteItemsQuery = 'DELETE FROM order_items WHERE commande_id = ?';
    db.query(deleteItemsQuery, [commandeId], (err) => {
      if (err) {
        console.error('❌ Erreur suppression order_items:', err);
        return res.status(500).json({ success: false, message: 'Erreur lors de l\'annulation' });
      }

      const deleteCommandeQuery = 'DELETE FROM commandes WHERE id = ? AND user_id = ?';
      db.query(deleteCommandeQuery, [commandeId, userId], (err) => {
        if (err) {
          console.error('❌ Erreur suppression commande:', err);
          return res.status(500).json({ success: false, message: 'Erreur lors de l\'annulation' });
        }

        console.log('✅ Commande #' + commandeId + ' annulée et supprimée');
        res.json({ 
          success: true, 
          message: 'Commande annulée avec succès' 
        });
      });
    });
  });
});

app.post('/api/achat', (req, res) => {
  const { user_id, nom, telephone, adresse, ville, code_postal, mode_paiement } = req.body;

  if (!user_id || !nom || !telephone || !adresse || !ville) {
    return res.status(400).json({ success: false, message: 'Données manquantes' });
  }

  const panierQuery = `
    SELECT 
      panier.quantite, 
      panier.prix_unitaire,
      parfums.id as parfum_id,
      parfums.nom as parfum_nom,
      parfums.marque as parfum_marque,
      parfums.prix,
      parfums.image_url
    FROM panier
    JOIN parfums ON panier.parfum_id = parfums.id
    WHERE panier.user_id = ?
  `;

  db.query(panierQuery, [user_id], (err, panierItems) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    if (panierItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Panier vide' });
    }

    const total = panierItems.reduce((sum, item) => 
      sum + (item.quantite * parseFloat(item.prix_unitaire || item.prix)), 0
    );

    const commandeQuery = `
      INSERT INTO commandes 
      (user_id, total, items_count, nom, telephone, adresse, ville, code_postal, mode_paiement, statut) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmee')
    `;

    db.query(
      commandeQuery, 
      [user_id, total, panierItems.length, nom, telephone, adresse, ville, code_postal || null, mode_paiement],
      (err, result) => {
        if (err) {
          return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }

        const commandeId = result.insertId;

        // Sauvegarder les items de la commande
        const orderItemsPromises = panierItems.map(item => {
          return new Promise((resolve, reject) => {
            const prixUnitaire = item.prix_unitaire || item.prix;
            const totalItem = item.quantite * parseFloat(prixUnitaire);
            
            const insertItemQuery = `
              INSERT INTO order_items 
              (commande_id, parfum_id, parfum_nom, parfum_marque, parfum_image_url, prix_unitaire, quantite, total_item)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            db.query(insertItemQuery, [
              commandeId, 
              item.parfum_id, 
              item.parfum_nom, 
              item.parfum_marque, 
              item.image_url, 
              prixUnitaire, 
              item.quantite, 
              totalItem
            ], (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        });

        Promise.all(orderItemsPromises)
          .then(() => {
            // Vider le panier après avoir sauvegardé les items
            const deleteQuery = 'DELETE FROM panier WHERE user_id = ?';
            db.query(deleteQuery, [user_id], (err) => {
              res.json({ 
                success: true, 
                message: 'Commande validée avec succès',
                commandeId: commandeId,
                total: total
              });
            });
          })
          .catch(err => {
            console.error('Erreur sauvegarde order_items:', err);
            res.status(500).json({ success: false, message: 'Erreur sauvegarde items' });
          });
      }
    );
  });
});

// ============================================
// ROUTES PARFUMS AVEC PROMOTIONS
// ============================================

// Route pour obtenir les parfums avec leurs promotions actives
app.get('/api/parfums-with-promotions', (req, res) => {
  const { categorie } = req.query;
  let query = `
    SELECT 
      p.*,
      pr.id as promotion_id,
      pr.discount_percentage,
      pr.start_date,
      pr.end_date,
      pr.description as promo_description,
      CASE 
        WHEN pr.id IS NOT NULL AND pr.is_active = 1 
        AND CURDATE() BETWEEN pr.start_date AND pr.end_date
        THEN ROUND(p.prix * (1 - pr.discount_percentage / 100), 2)
        ELSE p.prix
      END as prix_final,
      CASE 
        WHEN pr.id IS NOT NULL AND pr.is_active = 1 
        AND CURDATE() BETWEEN pr.start_date AND pr.end_date
        THEN 1 ELSE 0
      END as has_active_promotion
    FROM parfums p
    LEFT JOIN promotions pr ON p.id = pr.parfum_id 
      AND pr.is_active = 1 
      AND CURDATE() BETWEEN pr.start_date AND pr.end_date
    WHERE p.stock > 0
  `;
  
  let params = [];
  if (categorie && ['homme', 'femme', 'mixte'].includes(categorie)) {
    query += ' AND p.categorie = ?';
    params.push(categorie);
  }
  
  query += ' ORDER BY p.id DESC';
  
  db.query(query, params, (err, results) => {
    if (err) {
      console.error('❌ Erreur SQL parfums-promotions:', err);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
    res.json(results);
  });
});

// ============================================
// ROUTES PROMOTIONS
// ============================================

// Récupérer toutes les promotions
app.get('/api/admin/promotions', (req, res) => {
  const query = `
    SELECT 
      p.id,
      p.parfum_id,
      p.discount_percentage,
      p.start_date,
      p.end_date,
      p.description,
      p.is_active,
      pf.nom as parfum_nom,
      pf.marque as parfum_marque
    FROM promotions p
    JOIN parfums pf ON p.parfum_id = pf.id
    ORDER BY p.created_at DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Erreur SQL:', err);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
    res.json(results);
  });
});

// Créer une nouvelle promotion
app.post('/api/admin/promotions', (req, res) => {
  const { parfum_id, discount_percentage, start_date, end_date, description } = req.body;

  if (!parfum_id || !discount_percentage || !start_date || !end_date) {
    return res.status(400).json({ success: false, message: 'Données manquantes' });
  }

  if (discount_percentage < 1 || discount_percentage > 90) {
    return res.status(400).json({ success: false, message: 'Le pourcentage doit être entre 1 et 90' });
  }

  const query = `
    INSERT INTO promotions (parfum_id, discount_percentage, start_date, end_date, description, is_active) 
    VALUES (?, ?, ?, ?, ?, 1)
  `;
  
  db.query(query, [parfum_id, discount_percentage, start_date, end_date, description || null], (err, result) => {
    if (err) {
      console.error('❌ Erreur insert promotion:', err);
      return res.status(500).json({ success: false, message: 'Erreur lors de la création: ' + err.message });
    }
    res.json({ success: true, message: 'Promotion créée', id: result.insertId });
  });
});

// Supprimer une promotion
app.delete('/api/admin/promotions/:id', (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM promotions WHERE id = ?';
  db.query(query, [id], (err) => {
    if (err) {
      console.error('❌ Erreur delete promotion:', err);
      return res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
    }
    res.json({ success: true, message: 'Promotion supprimée' });
  });
});

// Mettre à jour une promotion
app.put('/api/admin/promotions/:id', (req, res) => {
  const { id } = req.params;
  const { discount_percentage, start_date, end_date, description, is_active } = req.body;

  const query = `
    UPDATE promotions 
    SET discount_percentage = ?, start_date = ?, end_date = ?, description = ?, is_active = ?
    WHERE id = ?
  `;
  
  db.query(query, [discount_percentage, start_date, end_date, description, is_active, id], (err) => {
    if (err) {
      console.error('❌ Erreur update promotion:', err);
      return res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour' });
    }
    res.json({ success: true, message: 'Promotion mise à jour' });
  });
});

// Mettre à jour le téléphone d'un utilisateur
app.put('/api/admin/users/:id/phone', (req, res) => {
  const { id } = req.params;
  const { telephone } = req.body;

  if (!telephone) {
    return res.status(400).json({ success: false, message: 'Numéro de téléphone requis' });
  }

  const query = 'UPDATE users SET telephone = ? WHERE id = ?';
  db.query(query, [telephone, id], (err, result) => {
    if (err) {
      console.error('❌ Erreur update téléphone:', err);
      return res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    
    res.json({ success: true, message: 'Téléphone mis à jour avec succès' });
  });
});

// ============================================
// ROUTES WISHLIST
// ============================================

// Récupérer la wishlist d'un utilisateur
app.get('/api/wishlist/:userId', (req, res) => {
  const { userId } = req.params;
  
  const query = `
    SELECT 
      w.*,
      p.nom,
      p.marque,
      p.prix,
      p.image_url,
      p.stock,
      p.categorie
    FROM wishlist w
    JOIN parfums p ON w.parfum_id = p.id
    WHERE w.user_id = ?
    ORDER BY w.date_ajout DESC
  `;
  
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('❌ Erreur SQL wishlist:', err);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
    res.json(results);
  });
});

// Ajouter à la wishlist
app.post('/api/wishlist', (req, res) => {
  const { user_id, parfum_id, note_personnelle, priorite } = req.body;

  if (!user_id || !parfum_id) {
    return res.status(400).json({ success: false, message: 'Données manquantes' });
  }

  const query = 'INSERT INTO wishlist (user_id, parfum_id, note_personnelle, priorite) VALUES (?, ?, ?, ?)';
  db.query(query, [user_id, parfum_id, note_personnelle || null, priorite || 'moyenne'], (err) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, message: 'Déjà dans la wishlist' });
      }
      console.error('❌ Erreur insert wishlist:', err);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
    res.json({ success: true, message: 'Ajouté à la wishlist' });
  });
});

// Retirer de la wishlist
app.delete('/api/wishlist/:userId/:parfumId', (req, res) => {
  const { userId, parfumId } = req.params;

  const query = 'DELETE FROM wishlist WHERE user_id = ? AND parfum_id = ?';
  db.query(query, [userId, parfumId], (err) => {
    if (err) {
      console.error('❌ Erreur delete wishlist:', err);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
    res.json({ success: true, message: 'Retiré de la wishlist' });
  });
});

// Vérifier si un parfum est dans la wishlist
app.get('/api/wishlist/:userId/:parfumId', (req, res) => {
  const { userId, parfumId } = req.params;

  const query = 'SELECT id FROM wishlist WHERE user_id = ? AND parfum_id = ?';
  db.query(query, [userId, parfumId], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
    res.json({ inWishlist: results.length > 0 });
  });
});

// ============================================
// ROUTES AVIS
// ============================================

// Récupérer tous les avis pour l'admin
app.get('/api/admin/avis', (req, res) => {
  const query = `
    SELECT 
      a.*,
      u.nom as user_nom,
      u.email as user_email,
      p.nom as parfum_nom,
      p.marque as parfum_marque,
      p.image_url as parfum_image
    FROM avis a
    LEFT JOIN users u ON a.user_id = u.id
    LEFT JOIN parfums p ON a.parfum_id = p.id
    ORDER BY a.date_avis DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Erreur SQL avis admin:', err);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
    res.json(results);
  });
});

// Ajouter un avis
app.post('/api/avis', (req, res) => {
  const { user_id, parfum_id, commande_id, note, commentaire } = req.body;

  if (!user_id || !parfum_id || !note) {
    return res.status(400).json({ success: false, message: 'Données manquantes' });
  }

  if (note < 1 || note > 5) {
    return res.status(400).json({ success: false, message: 'La note doit être entre 1 et 5' });
  }

  // Vérifier si l'utilisateur a déjà donné un avis pour ce parfum
  const checkQuery = 'SELECT id FROM avis WHERE user_id = ? AND parfum_id = ?';
  db.query(checkQuery, [user_id, parfum_id], (err, existing) => {
    if (err) {
      console.error('❌ Erreur vérification avis:', err);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Vous avez déjà donné un avis pour ce parfum' });
    }

    const insertQuery = `
      INSERT INTO avis (user_id, parfum_id, commande_id, note, commentaire) 
      VALUES (?, ?, ?, ?, ?)
    `;
    
    db.query(insertQuery, [user_id, parfum_id, commande_id || null, note, commentaire || null], (err, result) => {
      if (err) {
        console.error('❌ Erreur insert avis:', err);
        return res.status(500).json({ success: false, message: 'Erreur lors de l\'ajout de l\'avis' });
      }
      
      res.json({ 
        success: true, 
        message: 'Avis ajouté avec succès',
        avisId: result.insertId
      });
    });
  });
});

// Ajouter un avis de commande simple
app.post('/api/avis-commande-simple', (req, res) => {
  const { user_id, commande_id, note, commentaire } = req.body;

  if (!user_id || !commande_id || !note) {
    return res.status(400).json({ success: false, message: 'Données manquantes' });
  }

  if (note < 1 || note > 5) {
    return res.status(400).json({ success: false, message: 'La note doit être entre 1 et 5' });
  }

  // Vérifier si l'utilisateur a déjà donné un avis pour cette commande
  const checkQuery = 'SELECT id FROM avis_commandes_simple WHERE user_id = ? AND commande_id = ?';
  db.query(checkQuery, [user_id, commande_id], (err, existing) => {
    if (err) {
      console.error('❌ Erreur vérification avis commande:', err);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Vous avez déjà donné un avis pour cette commande' });
    }

    const insertQuery = `
      INSERT INTO avis_commandes_simple (user_id, commande_id, note, commentaire) 
      VALUES (?, ?, ?, ?)
    `;
    
    db.query(insertQuery, [user_id, commande_id, note, commentaire || null], (err, result) => {
      if (err) {
        console.error('❌ Erreur insert avis commande:', err);
        return res.status(500).json({ success: false, message: 'Erreur lors de l\'ajout de l\'avis' });
      }
      
      res.json({ 
        success: true, 
        message: 'Avis ajouté avec succès',
        avisId: result.insertId
      });
    });
  });
});

// Récupérer les détails d'une commande pour l'avis
app.get('/api/commandes/:commandeId/details/:userId', (req, res) => {
  const { commandeId, userId } = req.params;
  
  const query = `
    SELECT 
      c.*,
      COUNT(oi.id) as items_count
    FROM commandes c
    LEFT JOIN order_items oi ON c.id = oi.commande_id
    WHERE c.id = ? AND c.user_id = ?
    GROUP BY c.id
  `;
  
  db.query(query, [commandeId, userId], (err, results) => {
    if (err) {
      console.error('❌ Erreur SQL commande details:', err);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }
    
    res.json({ success: true, commande: results[0] });
  });
});

// Récupérer tous les avis de commandes simples pour l'admin
app.get('/api/admin/avis-commandes', (req, res) => {
  const query = `
    SELECT 
      ac.*,
      u.nom as user_nom,
      u.email as user_email,
      c.total as commande_total,
      c.date_commande
    FROM avis_commandes_simple ac
    LEFT JOIN users u ON ac.user_id = u.id
    LEFT JOIN commandes c ON ac.commande_id = c.id
    ORDER BY ac.date_avis DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Erreur SQL avis commandes admin:', err);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
    res.json(results);
  });
});

// Supprimer un avis de commande simple (admin)
app.delete('/api/admin/avis-commandes/:id', (req, res) => {
  const { id } = req.params;
  
  const query = 'DELETE FROM avis_commandes_simple WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('❌ Erreur suppression avis commande:', err);
      return res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Avis non trouvé' });
    }
    
    res.json({ success: true, message: 'Avis supprimé avec succès' });
  });
});

// Supprimer un avis de parfum (admin)
app.delete('/api/admin/avis/:id', (req, res) => {
  const { id } = req.params;
  
  const query = 'DELETE FROM avis WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('❌ Erreur suppression avis parfum:', err);
      return res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Avis non trouvé' });
    }
    
    res.json({ success: true, message: 'Avis supprimé avec succès' });
  });
});

// Récupérer les avis d'un parfum
app.get('/api/avis/parfum/:parfumId', (req, res) => {
  const { parfumId } = req.params;
  
  const query = `
    SELECT 
      a.*,
      u.nom as user_nom
    FROM avis a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE a.parfum_id = ?
    ORDER BY a.date_avis DESC
  `;
  
  db.query(query, [parfumId], (err, results) => {
    if (err) {
      console.error('❌ Erreur SQL avis parfum:', err);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
    res.json(results);
  });
});

// Récupérer les parfums d'une commande pour lesquels l'utilisateur peut donner un avis
app.get('/api/commandes/:commandeId/parfums-avis/:userId', (req, res) => {
  const { commandeId, userId } = req.params;
  
  const query = `
    SELECT 
      oi.parfum_id,
      oi.parfum_nom,
      oi.parfum_marque,
      oi.parfum_image_url,
      oi.prix_unitaire,
      oi.quantite,
      CASE 
        WHEN a.id IS NOT NULL THEN 1 
        ELSE 0 
      END as avis_donne,
      a.note,
      a.commentaire
    FROM order_items oi
    LEFT JOIN avis a ON oi.parfum_id = a.parfum_id AND a.user_id = ?
    WHERE oi.commande_id = ?
  `;
  
  db.query(query, [userId, commandeId], (err, results) => {
    if (err) {
      console.error('❌ Erreur SQL parfums avis:', err);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
    res.json({ success: true, parfums: results });
  });
});

app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err);
  res.status(500).json({ success: false, message: 'Erreur serveur interne' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('=================================');
  console.log(`🚀 Serveur démarré sur:`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   http://10.0.2.2:${PORT} (Android Emulator)`);
  console.log(`   http://20.30.2.10:${PORT} (Téléphone physique)`);
  console.log('=================================');
});