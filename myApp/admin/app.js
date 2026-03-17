const API_URL = 'http://192.168.11.102:3000/api';

// Admin App Component
class AdminApp {
  constructor() {
    this.currentPage = 'dashboard';
    this.adminToken = localStorage.getItem('adminToken');
    this.editingParfumId = null;
    this.currentOrderFilters = {}; // Stocker les filtres actuels
    this.init();
  }

  init() {
    if (!this.adminToken) {
      this.showLoginPage();
    } else {
      this.showDashboard();
    }
  }

  showLoginPage() {
    document.getElementById('root').innerHTML = `
      <div class="form-container" style="margin-top: 100px;">
        <h2 style="margin-bottom: 30px; text-align: center;">Admin Login</h2>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="adminEmail" placeholder="admin@example.com">
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="adminPassword" placeholder="••••••••">
        </div>
        <div class="form-actions">
          <button class="submit-btn" onclick="app.handleAdminLogin()">Login</button>
        </div>
      </div>
    `;
  }

  handleAdminLogin() {
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;

    // Simple admin check (in production, verify with backend)
    if (email === 'admin@parfums.com' && password === 'admin123') {
      this.adminToken = 'admin_token_' + Date.now();
      localStorage.setItem('adminToken', this.adminToken);
      this.showDashboard();
    } else {
      alert('Invalid credentials');
    }
  }

  logout() {
    localStorage.removeItem('adminToken');
    this.adminToken = null;
    this.showLoginPage();
  }

  showDashboard() {
    this.currentPage = 'dashboard';
    this.render();
    this.loadDashboardData();
  }

  render() {
    const content = this.getPageContent();
    document.getElementById('root').innerHTML = `
      <div class="admin-container">
        <div class="sidebar">
          <div class="sidebar-logo">🏪 Admin</div>
          <ul class="sidebar-menu">
            <li><button onclick="app.showDashboard()" class="${this.currentPage === 'dashboard' ? 'active' : ''}">📊 Dashboard</button></li>
            <li><button onclick="app.showParfums()" class="${this.currentPage === 'parfums' ? 'active' : ''}">🌹 Parfums</button></li>
            <li><button onclick="app.showPromotions()" class="${this.currentPage === 'promotions' ? 'active' : ''}">🎁 Promotions</button></li>
            <li><button onclick="app.showOrders()" class="${this.currentPage === 'orders' ? 'active' : ''}">📦 Orders</button></li>
            <li><button onclick="app.showUsers()" class="${this.currentPage === 'users' ? 'active' : ''}">👥 Users</button></li>
            <li><button onclick="app.showAvis()" class="${this.currentPage === 'avis' ? 'active' : ''}">⭐ Avis</button></li>
          </ul>
        </div>
        <div class="main-content">
          <div class="header">
            <div class="header-title">${this.getPageTitle()}</div>
            <div class="header-actions">
              <button class="logout-btn" onclick="app.logout()">Logout</button>
            </div>
          </div>
          <div class="content">
            ${content}
          </div>
        </div>
      </div>
    `;
    
    // Forcer la mise à jour du DOM
    if (this.currentPage === 'orders') {
      // Utiliser requestAnimationFrame pour s'assurer que le DOM est mis à jour
      requestAnimationFrame(() => {
        this.initializeOrdersPage();
      });
    }
  }

  getPageTitle() {
    const titles = {
      dashboard: '📊 Dashboard',
      parfums: '🌹 Parfums Management',
      promotions: '🎁 Promotions Management',
      orders: '📦 Orders Management',
      users: '👥 Users Management',
      avis: '⭐ Avis Clients'
    };
    return titles[this.currentPage] || 'Admin Panel';
  }

  getPageContent() {
    switch(this.currentPage) {
      case 'dashboard':
        return this.getDashboardContent();
      case 'parfums':
        return this.getParfumsContent();
      case 'promotions':
        return this.getPromotionsContent();
      case 'orders':
        return this.getOrdersContent();
      case 'users':
        return this.getUsersContent();
      case 'avis':
        return this.getAvisContent();
      default:
        return '<p>Page not found</p>';
    }
  }

  getDashboardContent() {
    return `
      <div class="dashboard" id="dashboardStats">
        <div class="stat-card">
          <div class="stat-label">Total Parfums</div>
          <div class="stat-value" id="totalParfums">-</div>
         
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Orders</div>
          <div class="stat-value" id="totalOrders">-</div>
          
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Users</div>
          <div class="stat-value" id="totalUsers">-</div>
          
        </div>
        <div class="stat-card">
          <div class="stat-label">Revenue</div>
          <div class="stat-value" id="totalRevenue">-</div>
         
        </div>
      </div>
      <div class="table-container">
        <div class="table-header">
          <div class="table-title">Recent Orders</div>
        </div>
        <table id="recentOrdersTable">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody id="recentOrdersBody">
            <tr><td colspan="5" class="loading">Loading...</td></tr>
          </tbody>
        </table>
      </div>
    `;
  }

  getParfumsContent() {
    return `
      <div class="table-container">
        <div class="table-header">
          <div class="table-title">Parfums List</div>
          <button class="add-btn" onclick="app.showAddParfumForm()">+ Add Parfum</button>
        </div>
        <table id="parfumsTable">
          <thead>
            <tr>
              <th>ID</th>
              <th>Parfum</th>
              <th>Marque</th>
              <th>Catégorie</th>
              <th>Prix</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="parfumsBody">
            <tr><td colspan="6" class="loading">Loading...</td></tr>
          </tbody>
        </table>
      </div>
      <div id="parfumModal" class="modal">
        <div class="modal-content" id="parfumFormContent"></div>
      </div>
    `;
  }

  getOrdersContent() {
    return `
      <div class="table-container">
        <div class="table-header">
          <div class="table-title">Gestion des Commandes</div>
          <div>
            <button class="add-btn" onclick="app.toggleOrderFilters()">🔍 Filtres</button>
               </div>
        </div>
        
        <div id="orderFilters" class="filters-container" style="display: block;">
          <div class="filters-row">
            <div class="filter-group">
              <label>📅 Date de début:</label>
              <input type="date" id="filterDateFrom">
            </div>
            <div class="filter-group">
              <label>📅 Date de fin:</label>
              <input type="date" id="filterDateTo">
            </div>
            <div class="filter-group">
              <label>📊 Statut:</label>
              <select id="filterStatut">
                <option value="all">Tous les statuts</option>
                <option value="confirmee">✅ Confirmée</option>
                <option value="en_cours">🚚 En cours</option>
                <option value="livree">📦 Livrée</option>
                <option value="annulee">❌ Annulée</option>
              </select>
            </div>
            <div class="filter-actions">
              <button class="submit-btn" onclick="app.applyOrderFilters()" id="applyFiltersBtn">Appliquer</button>
              <button class="cancel-btn" onclick="app.clearOrderFilters()">Effacer</button>
              <span id="filterStatus" style="margin-left: 10px; font-size: 12px; color: #666;"></span>
            </div>
          </div>
        </div>
        
        <table id="ordersTable">
          <thead>
            <tr>
              <th>ID Commande</th>
              <th>Client</th>
              <th>Articles</th>
              <th>Total</th>
              <th>Statut</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="ordersBody">
            <tr><td colspan="7" class="loading">Chargement...</td></tr>
          </tbody>
        </table>
      </div>
      <div id="orderModal" class="modal">
        <div class="modal-content" id="orderFormContent"></div>
      </div>
    `;
  }

  getUsersContent() {
    return `
      <div class="table-container">
        <div class="table-header">
          <div class="table-title">Gestion des Utilisateurs</div>
        </div>
        <table id="usersTable">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Email</th>
              <th>Téléphone</th>
              <th>Commandes</th>
              <th>Total Dépensé</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="usersBody">
            <tr><td colspan="7" class="loading">Chargement...</td></tr>
          </tbody>
        </table>
      </div>
      <div id="userModal" class="modal">
        <div class="modal-content" id="userModalContent"></div>
      </div>
    `;
  }

  showParfums() {
    this.currentPage = 'parfums';
    this.render();
    this.loadParfums();
  }

  showOrders() {
    this.currentPage = 'orders';
    this.render();
    // L'initialisation se fait maintenant dans render() avec requestAnimationFrame
  }

  initializeOrdersPage() {
    // Vérifier que les éléments existent avant de continuer
    const maxAttempts = 10;
    let attempts = 0;
    
    const checkAndInitialize = () => {
      const dateFromElement = document.getElementById('filterDateFrom');
      const dateToElement = document.getElementById('filterDateTo');
      const statutElement = document.getElementById('filterStatut');
      const statusElement = document.getElementById('filterStatus');
      
      if (dateFromElement && dateToElement && statutElement) {
        console.log('✅ Éléments de filtrage trouvés, initialisation...');
        
        // Mettre à jour le statut
      
        
        // Appliquer les filtres précédents s'ils existent
        this.loadOrders(this.currentOrderFilters);
        // Restaurer les valeurs des filtres dans l'interface
        this.restoreFilterValues();
      } else {
        attempts++;
        if (attempts < maxAttempts) {
          console.log(`⏳ Tentative ${attempts}/${maxAttempts} - Éléments non trouvés, nouvelle tentative...`);
          
          // Mettre à jour le statut
          const statusElement = document.getElementById('filterStatus');
          if (statusElement) {
            statusElement.textContent = `⏳ Chargement... (${attempts}/${maxAttempts})`;
            statusElement.style.color = '#ffc107';
          }
          
          setTimeout(checkAndInitialize, 100);
        } else {
          console.error('❌ Impossible de trouver les éléments de filtrage après', maxAttempts, 'tentatives');
          
          // Mettre à jour le statut d'erreur
          const statusElement = document.getElementById('filterStatus');
          if (statusElement) {
            statusElement.textContent = '❌ Erreur chargement filtres';
            statusElement.style.color = '#dc3545';
          }
          
          // Charger les commandes sans filtres en dernier recours
          this.loadOrders();
        }
      }
    };
    
    checkAndInitialize();
  }

  showUsers() {
    this.currentPage = 'users';
    this.render();
    this.loadUsers();
  }



  loadDashboardData() {
    this.loadStats();
    this.loadRecentOrders();
  }

  loadStats() {
    // Charger le nombre de parfums
    fetch(`${API_URL}/parfums`)
      .then(res => res.json())
      .then(parfums => {
        document.getElementById('totalParfums').textContent = parfums.length;
      })
      .catch(err => console.error('Error loading parfums:', err));

    // Charger les statistiques des commandes
    fetch(`${API_URL}/admin/orders`)
      .then(res => res.json())
      .then(orders => {
        document.getElementById('totalOrders').textContent = orders.length;
        const revenue = orders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);
        document.getElementById('totalRevenue').textContent = revenue.toFixed(2) + ' DH';
      })
      .catch(err => console.error('Error loading orders:', err));

    // Charger le nombre d'utilisateurs
    fetch(`${API_URL}/admin/users`)
      .then(res => res.json())
      .then(users => {
        document.getElementById('totalUsers').textContent = users.length;
      })
      .catch(err => console.error('Error loading users:', err));
  }

  loadRecentOrders() {
    fetch(`${API_URL}/admin/orders`)
      .then(res => res.json())
      .then(orders => {
        const recentOrders = orders.slice(0, 5);
        const tbody = document.getElementById('recentOrdersBody');
        tbody.innerHTML = recentOrders.map(order => `
          <tr>
            <td>#${order.id}</td>
            <td>${order.nom}</td>
            <td>${order.total} DH</td>
            <td><span class="status-badge status-${order.statut}">${this.getStatusLabel(order.statut)}</span></td>
            <td>${new Date(order.date_commande).toLocaleDateString('fr-FR')}</td>
          </tr>
        `).join('');
      })
      .catch(err => console.error('Error loading recent orders:', err));
  }

  showAvis() {
    this.currentPage = 'avis';
    this.render();
    this.loadAvis();
  }

  getAvisContent() {
    return `
      <div class="table-container">
        <div class="table-header">
          <div class="table-title">Avis Clients Management</div>
          <button class="add-btn" onclick="app.loadAvis()">🔄 Actualiser</button>
        </div>
        <table id="avisTable">
          <thead>
            <tr>
              <th>ID</th>
              <th>Client</th>
              <th>Commande</th>
              <th>Note</th>
              <th>Commentaire</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="avisBody">
            <tr><td colspan="7" class="loading">Chargement...</td></tr>
          </tbody>
        </table>
      </div>
    `;
  }

  loadAvis() {
    fetch(`${API_URL}/admin/avis-commandes`)
      .then(res => res.json())
      .then(avis => {
        this.renderAvisTable(avis);
      })
      .catch(err => {
        console.error('Error loading avis:', err);
        document.getElementById('avisBody').innerHTML = `
          <tr><td colspan="7" style="text-align: center; padding: 20px; color: red;">Erreur de chargement</td></tr>
        `;
      });
  }

  renderAvisTable(avis) {
    const tbody = document.getElementById('avisBody');
    
    if (avis.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Aucun avis trouvé</td></tr>';
      return;
    }

    tbody.innerHTML = avis.map(avis => `
      <tr>
        <td>#${avis.id}</td>
        <td>
          <div>
            <div style="font-weight: bold;">${avis.user_nom}</div>
            <div style="font-size: 12px; color: #666;">${avis.user_email}</div>
          </div>
        </td>
        <td>
          <div>
            <div style="font-weight: bold;">Commande #${avis.commande_id}</div>
            <div style="font-size: 12px; color: #666;">${avis.commande_total} DH</div>
          </div>
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 5px;">
            ${this.renderStars(avis.note)}
            <span style="font-weight: bold; color: #ffc107;">${avis.note}/5</span>
          </div>
        </td>
        <td>
          <div style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${avis.commentaire || 'Aucun commentaire'}">
            ${avis.commentaire || '<em style="color: #999;">Aucun commentaire</em>'}
          </div>
        </td>
        <td>${new Date(avis.date_avis).toLocaleDateString('fr-FR')}</td>
        <td>
          <button class="action-btn delete-btn" onclick="app.deleteAvis(${avis.id})">🗑️ Delete</button>
        </td>
      </tr>
    `).join('');
  }

  deleteAvis(avisId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet avis ?')) return;
    
    fetch(`${API_URL}/admin/avis-commandes/${avisId}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          alert('✅ Avis supprimé avec succès');
          this.loadAvis();
        } else {
          alert('❌ Erreur: ' + result.message);
        }
      })
      .catch(err => {
        console.error('Error deleting avis:', err);
        alert('❌ Erreur lors de la suppression');
      });
  }

  loadParfums() {
    axios.get(`${API_URL}/parfums`)
      .then(res => {
        const tbody = document.getElementById('parfumsBody');
        if (res.data.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No parfums found</td></tr>';
          return;
        }
        tbody.innerHTML = res.data.map(parfum => `
          <tr>
            <td>#${parfum.id}</td>
            <td>
              <div style="display: flex; align-items: center; gap: 10px;">
                ${parfum.image_url ? `<img src="http://localhost:3000${parfum.image_url}" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover; border: 1px solid #ddd;" onerror="console.error('Erreur image parfum ${parfum.id}:', this.src); this.style.display='none'; this.nextElementSibling.style.display='inline';" onload="console.log('Image parfum ${parfum.id} chargée');">` : ''}<span style="display: ${parfum.image_url ? 'none' : 'inline'};">📦</span>
                <span>${parfum.nom}</span>
              </div>
            </td>
            <td>${parfum.marque}</td>
            <td>
              <span class="category-badge category-${parfum.categorie || 'mixte'}">
                ${parfum.categorie === 'femme' ? ' Femme' : parfum.categorie === 'homme' ? ' Homme' : ' Mixte'}
              </span>
            </td>
            <td><strong>${parfum.prix} DH</strong></td>
            <td><strong>${parfum.stock}</strong></td>
            <td>
              <button class="action-btn edit-btn" onclick="app.editParfum(${parfum.id}, '${parfum.nom.replace(/'/g, "\\'")}', '${parfum.marque.replace(/'/g, "\\'")}', '${parfum.categorie || 'mixte'}', ${parfum.prix}, ${parfum.stock})">✏️ Edit</button>
              <button class="action-btn delete-btn" onclick="app.deleteParfum(${parfum.id}, '${parfum.nom}')">🗑️ Delete</button>
            </td>
          </tr>
        `).join('');
      })
      .catch(err => console.error('Error loading parfums:', err));
  }

  loadOrders(filters = {}) {
    let url = `${API_URL}/admin/orders`;
    const params = new URLSearchParams();
    
    console.log('🔍 Filtres reçus dans loadOrders:', filters);
    
    if (filters.dateFrom && filters.dateFrom.trim() !== '') {
      params.append('dateFrom', filters.dateFrom);
      console.log('📅 Ajout filtre dateFrom:', filters.dateFrom);
    }
    if (filters.dateTo && filters.dateTo.trim() !== '') {
      params.append('dateTo', filters.dateTo);
      console.log('📅 Ajout filtre dateTo:', filters.dateTo);
    }
    if (filters.statut && filters.statut !== 'all' && filters.statut.trim() !== '') {
      params.append('statut', filters.statut);
      console.log('📊 Ajout filtre statut:', filters.statut);
    }
    
    if (params.toString()) {
      url += '?' + params.toString();
    }
    
    console.log('🔍 URL finale:', url);
    
    fetch(url)
      .then(res => res.json())
      .then(orders => {
        const tbody = document.getElementById('ordersBody');
        if (orders.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Aucune commande trouvée</td></tr>';
          return;
        }
        tbody.innerHTML = orders.map(order => `
          <tr>
            <td>#${order.id}</td>
            <td>${order.nom}</td>
            <td>${order.items_count || 'N/A'}</td>
            <td>${order.total} DH</td>
            <td><span class="status-badge status-${order.statut}">${this.getStatusLabel(order.statut)}</span></td>
            <td>${new Date(order.date_commande).toLocaleDateString('fr-FR')}</td>
            <td>
              <button class="action-btn edit-btn" onclick="app.editOrder(${order.id}, '${order.statut}', '${order.nom}', ${order.total})">🔄 Modifier</button>
              <button class="action-btn view-btn" onclick="app.viewOrderDetails(${order.id})">👁️ Détails</button>
            </td>
          </tr>
        `).join('');
      })
      .catch(err => {
        console.error('Erreur chargement commandes:', err);
        document.getElementById('ordersBody').innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: red;">Erreur de chargement</td></tr>';
      });
  }

  toggleOrderFilters() {
    const filtersContainer = document.getElementById('orderFilters');
    if (filtersContainer.style.display === 'none') {
      filtersContainer.style.display = 'block';
    } else {
      filtersContainer.style.display = 'none';
    }
  }

  applyOrderFilters() {
    // Essayer plusieurs fois de trouver les éléments
    const maxAttempts = 5;
    let attempts = 0;
    
    const tryApplyFilters = () => {
      const dateFromElement = document.getElementById('filterDateFrom');
      const dateToElement = document.getElementById('filterDateTo');
      const statutElement = document.getElementById('filterStatut');
      
      if (dateFromElement && dateToElement && statutElement) {
        console.log('✅ Éléments trouvés, application des filtres...');
        
        const filters = {
          dateFrom: dateFromElement.value,
          dateTo: dateToElement.value,
          statut: statutElement.value
        };
        
        // Sauvegarder les filtres actuels
        this.currentOrderFilters = { ...filters };
        
        console.log('🔍 Application des filtres:', filters);
        this.loadOrders(filters);
      } else {
        attempts++;
        if (attempts < maxAttempts) {
          console.log(`⏳ Tentative ${attempts}/${maxAttempts} pour trouver les éléments de filtrage...`);
          setTimeout(tryApplyFilters, 100);
        } else {
          console.error('❌ Éléments de filtrage non trouvés après', maxAttempts, 'tentatives');
          alert('Erreur: Les filtres ne sont pas encore chargés. Veuillez attendre quelques secondes et réessayer, ou actualisez la page.');
        }
      }
    };
    
    tryApplyFilters();
  }

  clearOrderFilters() {
    // Vérifier que les éléments existent avant de les utiliser
    const dateFromElement = document.getElementById('filterDateFrom');
    const dateToElement = document.getElementById('filterDateTo');
    const statutElement = document.getElementById('filterStatut');
    
    if (!dateFromElement || !dateToElement || !statutElement) {
      console.error('❌ Éléments de filtrage non trouvés dans le DOM pour clear');
      return;
    }
    
    dateFromElement.value = '';
    dateToElement.value = '';
    statutElement.value = 'all';
    
    // Effacer les filtres sauvegardés
    this.currentOrderFilters = {};
    
    this.loadOrders();
  }

  restoreFilterValues() {
    // Restaurer les valeurs des filtres dans l'interface après un render
    setTimeout(() => {
      if (this.currentOrderFilters.dateFrom) {
        const dateFromInput = document.getElementById('filterDateFrom');
        if (dateFromInput) dateFromInput.value = this.currentOrderFilters.dateFrom;
      }
      if (this.currentOrderFilters.dateTo) {
        const dateToInput = document.getElementById('filterDateTo');
        if (dateToInput) dateToInput.value = this.currentOrderFilters.dateTo;
      }
      if (this.currentOrderFilters.statut) {
        const statutSelect = document.getElementById('filterStatut');
        if (statutSelect) statutSelect.value = this.currentOrderFilters.statut;
      }
    }, 100);
  }

  debugFilters() {
    const dateFromElement = document.getElementById('filterDateFrom');
    const dateToElement = document.getElementById('filterDateTo');
    const statutElement = document.getElementById('filterStatut');
    
    console.log('🐛 Debug Filtres:');
    console.log('🔍 Éléments DOM trouvés:');
    console.log('  - filterDateFrom:', dateFromElement ? 'OK' : 'MANQUANT');
    console.log('  - filterDateTo:', dateToElement ? 'OK' : 'MANQUANT');
    console.log('  - filterStatut:', statutElement ? 'OK' : 'MANQUANT');
    
    if (dateFromElement && dateToElement && statutElement) {
      const dateFrom = dateFromElement.value || '';
      const dateTo = dateToElement.value || '';
      const statut = statutElement.value || '';
      
      console.log('📅 Date From (input):', dateFrom);
      console.log('📅 Date To (input):', dateTo);
      console.log('📊 Statut (input):', statut);
      console.log('💾 Filtres sauvegardés:', this.currentOrderFilters);
      
      alert(`Debug Filtres:
Date From: "${dateFrom}"
Date To: "${dateTo}"
Statut: "${statut}"
Filtres sauvegardés: ${JSON.stringify(this.currentOrderFilters)}

Vérifiez la console pour plus de détails.`);
    } else {
      alert(`❌ Erreur: Certains éléments de filtrage sont manquants dans le DOM.
      
Éléments trouvés:
- Date From: ${dateFromElement ? 'OK' : 'MANQUANT'}
- Date To: ${dateToElement ? 'OK' : 'MANQUANT'}  
- Statut: ${statutElement ? 'OK' : 'MANQUANT'}

Essayez de naviguer vers une autre page puis revenir aux commandes.`);
    }
  }

  getStatusLabel(status) {
    const labels = {
      'confirmee': '✅ Confirmée',
      'en_cours': '🚚 En cours',
      'livree': '📦 Livrée',
      'annulee': '❌ Annulée'
    };
    return labels[status] || status;
  }

  loadUsers() {
    fetch(`${API_URL}/admin/users`)
      .then(res => res.json())
      .then(users => {
        const tbody = document.getElementById('usersBody');
        if (users.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Aucun utilisateur trouvé</td></tr>';
          return;
        }
        tbody.innerHTML = users.map(user => `
          <tr>
            <td>#${user.id}</td>
            <td>${user.nom}</td>
            <td>${user.email}</td>
            <td>${user.telephone || '<span style="color: #999;">Non renseigné</span>'}</td>
            <td><span class="badge">${user.orders_count || 0}</span></td>
            <td><strong>${parseFloat(user.total_spent || 0).toFixed(2)} DH</strong></td>
            <td>
              <button class="action-btn view-btn" onclick="app.viewUser(${user.id})">👁️ Détails</button>
            </td>
          </tr>
        `).join('');
      })
      .catch(err => {
        console.error('Erreur chargement users:', err);
        document.getElementById('usersBody').innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: red;">Erreur de chargement</td></tr>';
      });
  }

  showAddParfumForm() {
    const modal = document.getElementById('parfumModal');
    const content = document.getElementById('parfumFormContent');
    content.innerHTML = `
      <div class="modal-header">
        <h3>✨ Ajouter un nouveau parfum</h3>
        <button class="close-btn" onclick="app.closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>📝 Nom du parfum *</label>
          <input type="text" id="parfumName" placeholder="Ex: Chanel N°5" required>
        </div>
        <div class="form-group">
          <label>🏷️ Marque *</label>
          <input type="text" id="parfumBrand" placeholder="Ex: Chanel" required>
        </div>
        <div class="form-group">
          <label>👥 Catégorie *</label>
          <select id="parfumCategory" required>
            <option value="">Sélectionner une catégorie</option>
            <option value="femme">👩 Femme</option>
            <option value="homme">👨 Homme</option>
            <option value="mixte">👫 Mixte</option>
          </select>
        </div>
        <div class="form-group">
          <label>💰 Prix (DH) *</label>
          <input type="number" id="parfumPrice" placeholder="Ex: 299.99" step="0.01" required>
        </div>
        <div class="form-group">
          <label>📦 Stock *</label>
          <input type="number" id="parfumStock" placeholder="Ex: 50" required>
        </div>
        <div class="form-group">
          <label>📝 Description</label>
          <textarea id="parfumDescription" placeholder="Description du parfum (optionnel)" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label>📸 Image du parfum</label>
          <div class="file-upload-container">
            <input type="file" id="parfumImage" accept="image/*" onchange="app.previewImage(this)">
            <div class="file-upload-preview" id="imagePreview" style="display: none;">
              <img id="previewImg" src="" alt="Aperçu" style="max-width: 200px; max-height: 200px; border-radius: 8px;">
              <button type="button" class="remove-image-btn" onclick="app.removeImage()">❌ Supprimer</button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" onclick="app.closeModal()">Annuler</button>
        <button class="submit-btn" onclick="app.saveParfum()">✨ Ajouter le parfum</button>
      </div>
    `;
    modal.classList.add('active');
  }

  async saveParfum() {
    const nom = document.getElementById('parfumName').value.trim();
    const marque = document.getElementById('parfumBrand').value.trim();
    const categorie = document.getElementById('parfumCategory').value;
    const prix = parseFloat(document.getElementById('parfumPrice').value);
    const stock = parseInt(document.getElementById('parfumStock').value);
    const description = document.getElementById('parfumDescription').value.trim();
    const imageFile = document.getElementById('parfumImage').files[0];

    // Debug: afficher les valeurs
    console.log('Valeurs du formulaire:', { nom, marque, categorie, prix, stock, description });

    if (!nom || !marque || !categorie || isNaN(prix) || isNaN(stock)) {
      alert('❌ Veuillez remplir tous les champs requis (nom, marque, catégorie, prix, stock)');
      return;
    }

    if (prix <= 0 || stock < 0) {
      alert('❌ Le prix doit être positif et le stock doit être >= 0');
      return;
    }

    try {
      // Créer FormData pour envoyer le fichier
      const formData = new FormData();
      formData.append('nom', nom);
      formData.append('marque', marque);
      formData.append('categorie', categorie);
      formData.append('prix', prix);
      formData.append('stock', stock);
      if (description) formData.append('description', description);
      if (imageFile) formData.append('image', imageFile);

      console.log('🚀 Envoi de la requête...');
      const response = await fetch(`${API_URL}/admin/parfums`, {
        method: 'POST',
        body: formData
      });

      console.log('📡 Réponse reçue, status:', response.status);
      const result = await response.json();
      console.log('📋 Résultat:', result);
      
      if (result.success) {
        alert(`✅ Parfum ajouté avec succès!\n\n📝 Nom: ${nom}\n🏷️ Marque: ${marque}\n👥 Catégorie: ${categorie}\n💰 Prix: ${prix} DH\n📦 Stock: ${stock} unités`);
        this.closeModal();
        this.loadParfums();
      } else {
        console.error('❌ Échec:', result);
        alert('❌ Erreur: ' + result.message);
      }
    } catch (err) {
      console.error('❌ Exception:', err);
      alert('❌ Erreur lors de l\'ajout du parfum: ' + err.message);
    }
  }

  editParfum(id, nom, marque, categorie, prix, stock) {
    this.editingParfumId = id;
    const modal = document.getElementById('parfumModal');
    const content = document.getElementById('parfumFormContent');
    content.innerHTML = `
      <div class="modal-header">
        <h3>✏️ Modifier le parfum #${id}</h3>
        <button class="close-btn" onclick="app.closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>📝 Nom du parfum *</label>
          <input type="text" id="parfumName" value="${nom}" placeholder="Nom du parfum" required>
        </div>
        <div class="form-group">
          <label>🏷️ Marque *</label>
          <input type="text" id="parfumBrand" value="${marque}" placeholder="Marque" required>
        </div>
        <div class="form-group">
          <label>👥 Catégorie *</label>
          <select id="parfumCategory" required>
            <option value="femme" ${categorie === 'femme' ? 'selected' : ''}>👩 Femme</option>
            <option value="homme" ${categorie === 'homme' ? 'selected' : ''}>👨 Homme</option>
            <option value="mixte" ${categorie === 'mixte' ? 'selected' : ''}>👫 Mixte</option>
          </select>
        </div>
        <div class="form-group">
          <label>💰 Prix (DH) *</label>
          <input type="number" id="parfumPrice" value="${prix}" placeholder="Prix" step="0.01" required>
        </div>
        <div class="form-group">
          <label>📦 Stock *</label>
          <input type="number" id="parfumStock" value="${stock}" placeholder="Quantité en stock" required>
        </div>
        <div class="form-group">
          <label>📝 Description</label>
          <textarea id="parfumDescription" placeholder="Description du parfum (optionnel)" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label>📸 Nouvelle image (optionnel)</label>
          <div class="file-upload-container">
            <input type="file" id="parfumImage" accept="image/*" onchange="app.previewImage(this)">
            <div class="file-upload-preview" id="imagePreview" style="display: none;">
              <img id="previewImg" src="" alt="Aperçu" style="max-width: 200px; max-height: 200px; border-radius: 8px;">
              <button type="button" class="remove-image-btn" onclick="app.removeImage()">❌ Supprimer</button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" onclick="app.closeModal()">Annuler</button>
        <button class="submit-btn" onclick="app.updateParfum(${id})">✏️ Mettre à jour</button>
      </div>
    `;
    modal.classList.add('active');
  }

  async updateParfum(id) {
    const nom = document.getElementById('parfumName').value.trim();
    const marque = document.getElementById('parfumBrand').value.trim();
    const categorie = document.getElementById('parfumCategory').value;
    const prix = parseFloat(document.getElementById('parfumPrice').value);
    const stock = parseInt(document.getElementById('parfumStock').value);
    const description = document.getElementById('parfumDescription').value.trim();
    const imageFile = document.getElementById('parfumImage').files[0];

    if (!nom || !marque || !categorie || isNaN(prix) || isNaN(stock)) {
      alert('❌ Veuillez remplir tous les champs requis');
      return;
    }

    if (prix <= 0 || stock < 0) {
      alert('❌ Le prix doit être positif et le stock doit être >= 0');
      return;
    }

    try {
      // Utiliser FormData pour gérer l'image
      const formData = new FormData();
      formData.append('nom', nom);
      formData.append('marque', marque);
      formData.append('categorie', categorie);
      formData.append('prix', prix);
      formData.append('stock', stock);
      if (description) formData.append('description', description);
      if (imageFile) formData.append('image', imageFile);

      console.log('🔄 Mise à jour du parfum #' + id);
      const response = await fetch(`${API_URL}/admin/parfums/${id}`, {
        method: 'PUT',
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`✅ Parfum #${id} mis à jour avec succès!\n\n📝 Nom: ${nom}\n🏷️ Marque: ${marque}\n👥 Catégorie: ${categorie}\n💰 Prix: ${prix} DH\n📦 Stock: ${stock}`);
        this.closeModal();
        this.loadParfums();
      } else {
        alert('❌ Erreur: ' + result.message);
      }
    } catch (err) {
      console.error('❌ Erreur:', err);
      alert('❌ Erreur lors de la mise à jour: ' + err.message);
    }
  }

  deleteParfum(id, nom) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${nom}"?\n\nCette action ne peut pas être annulée!`)) {
      axios.delete(`${API_URL}/admin/parfums/${id}`)
        .then(res => {
          alert(`✅ Parfum "${nom}" a été supprimé avec succès!`);
          this.loadParfums();
        })
        .catch(err => {
          console.error('Erreur:', err);
          alert('❌ Erreur lors de la suppression du parfum');
        });
    }
  }

  editOrder(id, currentStatus, customerName, total) {
    const modal = document.getElementById('orderModal');
    const content = document.getElementById('orderFormContent');
    content.innerHTML = `
      <h3>Update Order #${id}</h3>
      <div class="form-group">
        <label>Customer Name</label>
        <input type="text" value="${customerName}" disabled style="background: #f0f0f0;">
      </div>
      <div class="form-group">
        <label>Total</label>
        <input type="text" value="${total} DH" disabled style="background: #f0f0f0;">
      </div>
      <div class="form-group">
        <label>Order Status</label>
        <select id="orderStatus">
          <option value="confirmee" ${currentStatus === 'confirmee' ? 'selected' : ''}>✅ Confirmée</option>
          <option value="en_cours" ${currentStatus === 'en_cours' ? 'selected' : ''}>🚚 En cours de livraison</option>
          <option value="livree" ${currentStatus === 'livree' ? 'selected' : ''}>📦 Livrée</option>
          <option value="annulee" ${currentStatus === 'annulee' ? 'selected' : ''}>❌ Annulée</option>
        </select>
      </div>
      <div class="form-actions">
        <button class="submit-btn" onclick="app.updateOrderStatus(${id})">Update Status</button>
        <button class="cancel-btn" onclick="app.closeOrderModal()">Cancel</button>
      </div>
    `;
    modal.classList.add('active');
  }

  updateOrderStatus(orderId) {
    const newStatus = document.getElementById('orderStatus').value;
    
    axios.put(`${API_URL}/admin/commandes/${orderId}`, { statut: newStatus })
      .then(res => {
        alert(`✅ Commande #${orderId} mise à jour!\n\nNouveau statut: ${this.getStatusLabel(newStatus)}`);
        this.closeOrderModal();
        this.loadOrders();
      })
      .catch(err => {
        console.error('Erreur:', err);
        alert('❌ Erreur lors de la mise à jour de la commande');
      });
  }

  closeOrderModal() {
    const modal = document.getElementById('orderModal');
    if (modal) {
      modal.classList.remove('active');
    }
  }

  async viewUser(id) {
    try {
      const response = await fetch(`${API_URL}/admin/users/${id}`);
      const result = await response.json();
      
      if (!result.success) {
        alert('Erreur: ' + result.message);
        return;
      }
      
      this.showUserDetails(result.user, result.orders);
    } catch (err) {
      console.error('Erreur chargement détails utilisateur:', err);
      alert('Erreur lors du chargement des détails utilisateur');
    }
  }

  showUserDetails(user, orders) {
    const modal = document.getElementById('userModal');
    const content = document.getElementById('userModalContent');
    
    content.innerHTML = `
      <div class="modal-header">
        <h3>👤 Détails Utilisateur #${user.id}</h3>
        <button class="close-btn" onclick="app.closeUserModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
          <div>
            <h4>📋 Informations Personnelles</h4>
            <p><strong>Nom:</strong> ${user.nom}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Téléphone:</strong> ${user.telephone || '<span style="color: #999;">Non renseigné</span>'}</p>
            <p><strong>ID Utilisateur:</strong> #${user.id}</p>
          </div>
          <div>
            <h4>📊 Statistiques</h4>
            <p><strong>Nombre de commandes:</strong> <span class="badge">${user.orders_count}</span></p>
            <p><strong>Total dépensé:</strong> <strong style="color: #6a4c93;">${parseFloat(user.total_spent).toFixed(2)} DH</strong></p>
            <p><strong>Moyenne par commande:</strong> ${user.orders_count > 0 ? (parseFloat(user.total_spent) / user.orders_count).toFixed(2) : '0.00'} DH</p>
          </div>
        </div>

        <div>
          <h4>🛍️ Historique des Commandes (10 dernières)</h4>
          ${orders.length > 0 ? this.renderUserOrders(orders) : `
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
              <p style="color: #666; margin: 0;">
                📦 Aucune commande trouvée<br>
                <small>Cet utilisateur n'a pas encore passé de commande</small>
              </p>
            </div>
          `}
        </div>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" onclick="app.closeUserModal()">Fermer</button>
        ${user.telephone ? '' : '<button class="submit-btn" onclick="app.addUserPhone(' + user.id + ')">📞 Ajouter Téléphone</button>'}
      </div>
    `;
    
    modal.classList.add('active');
  }

  renderUserOrders(orders) {
    return `
      <div style="max-height: 300px; overflow-y: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f8f9fa;">
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">ID</th>
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Date</th>
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Articles</th>
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Total</th>
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Statut</th>
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map(order => `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">#${order.id}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date(order.date_commande).toLocaleDateString('fr-FR')}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${order.items_count || 'N/A'}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>${order.total} DH</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">
                  <span class="status-badge status-${order.statut}">${this.getStatusLabel(order.statut)}</span>
                </td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">
                  <button class="action-btn view-btn" onclick="app.viewOrderDetails(${order.id})" style="font-size: 12px; padding: 4px 8px;">👁️ Voir</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  closeUserModal() {
    const modal = document.getElementById('userModal');
    if (modal) {
      modal.classList.remove('active');
    }
  }

  closeOrderModal() {
    const modal = document.getElementById('orderModal');
    if (modal) {
      modal.classList.remove('active');
    }
  }

  async addUserPhone(userId) {
    const phone = prompt('Entrez le numéro de téléphone:');
    if (!phone) return;
    
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}/phone`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telephone: phone })
      });
      
      const result = await response.json();
      if (result.success) {
        alert('Téléphone ajouté avec succès!');
        this.closeUserModal();
        this.loadUsers();
      } else {
        alert('Erreur: ' + result.message);
      }
    } catch (err) {
      console.error('Erreur ajout téléphone:', err);
      alert('Erreur lors de l\'ajout du téléphone');
    }
  }

  viewOrderDetails(orderId) {
    fetch(`${API_URL}/admin/orders/${orderId}/details`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          this.showOrderDetailsModal(data.order, data.items);
        } else {
          alert('❌ Erreur: ' + data.message);
        }
      })
      .catch(err => {
        console.error('Erreur:', err);
        alert('❌ Erreur lors du chargement des détails');
      });
  }

  showOrderDetailsModal(order, items) {
    const modal = document.getElementById('orderModal');
    const content = document.getElementById('orderFormContent');
    
    content.innerHTML = `
      <div class="modal-header">
        <h3>📦 Détails de la commande #${order.id}</h3>
        <button class="close-btn" onclick="app.closeOrderModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div>
            <h4>👤 Informations Client</h4>
            <p><strong>Nom:</strong> ${order.nom}</p>
            <p><strong>Email:</strong> ${order.user_email || 'N/A'}</p>
            <p><strong>Téléphone:</strong> ${order.telephone || 'N/A'}</p>
          </div>
          <div>
            <h4>📍 Adresse de Livraison</h4>
            <p><strong>Adresse:</strong> ${order.adresse || 'N/A'}</p>
            <p><strong>Ville:</strong> ${order.ville || 'N/A'}</p>
            <p><strong>Code Postal:</strong> ${order.code_postal || 'N/A'}</p>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div>
            <h4>💰 Informations Commande</h4>
            <p><strong>Total:</strong> ${order.total} DH</p>
            <p><strong>Mode de paiement:</strong> ${order.mode_paiement || 'N/A'}</p>
            <p><strong>Statut:</strong> <span class="status-badge status-${order.statut}">${this.getStatusLabel(order.statut)}</span></p>
          </div>
          <div>
            <h4>📅 Dates</h4>
            <p><strong>Date de commande:</strong> ${new Date(order.date_commande).toLocaleString('fr-FR')}</p>
            <p><strong>Nombre d'articles:</strong> ${order.items_count || 'N/A'}</p>
          </div>
        </div>

        <div>
          <h4>🛍️ Articles Commandés</h4>
          <div id="orderItemsContainer">
            ${items.length > 0 ? this.renderOrderItems(items) : `
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                <p style="color: #666; margin: 0;">
                  ⚠️ Aucun détail d'article disponible<br>
                  <small>Cette commande a été passée avant l'implémentation du système de détails</small>
                </p>
              </div>
            `}
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" onclick="app.closeOrderModal()">Fermer</button>
        <button class="submit-btn" onclick="app.editOrder(${order.id}, '${order.statut}', '${order.nom}', ${order.total})">🔄 Modifier Statut</button>
      </div>
    `;
    
    modal.classList.add('active');
  }

  getImageUrl(imageUrl) {
    if (!imageUrl) {
      console.log('getImageUrl: pas d\'URL fournie');
      return '';
    }
    if (imageUrl.startsWith('http')) {
      console.log('getImageUrl: URL complète détectée:', imageUrl);
      return imageUrl;
    }
    const fullUrl = `http://localhost:3000${imageUrl}`;
    console.log('getImageUrl: URL construite:', fullUrl);
    return fullUrl;
  }

  renderOrderItems(items) {
    if (!items || items.length === 0) {
      return '<p style="text-align: center; color: #666;">Aucun article</p>';
    }

    return `
      <div style="display: grid; gap: 15px;">
        ${items.map(item => `
          <div style="display: flex; align-items: center; gap: 15px; padding: 15px; background: white; border-radius: 8px; border: 1px solid #e0e0e0;">
            <div style="flex-shrink: 0;">
              ${item.parfum_image_url || item.current_image_url ? 
                `<img src="${this.getImageUrl(item.parfum_image_url || item.current_image_url)}" 
                     style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover; border: 2px solid #6a4c93;"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                 <div style="display: none; width: 60px; height: 60px; background: #f0f0f0; border-radius: 8px; align-items: center; justify-content: center; font-size: 24px;">📦</div>` 
                : '<div style="width: 60px; height: 60px; background: #f0f0f0; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 24px;">📦</div>'
              }
            </div>
            <div style="flex: 1;">
              <h5 style="margin: 0 0 5px 0; color: #333;">${item.parfum_nom}</h5>
              <p style="margin: 0 0 5px 0; color: #666; font-size: 14px;">🏷️ ${item.parfum_marque}</p>
              <div style="display: flex; gap: 15px; font-size: 14px;">
                <span><strong>Prix unitaire:</strong> ${item.prix_unitaire} DH</span>
                <span><strong>Quantité:</strong> ${item.quantite}</span>
                <span><strong>Total:</strong> <span style="color: #6a4c93; font-weight: bold;">${item.total_item} DH</span></span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  previewImage(input) {
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = function(e) {
        const preview = document.getElementById('imagePreview');
        const img = document.getElementById('previewImg');
        img.src = e.target.result;
        preview.style.display = 'block';
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  removeImage() {
    document.getElementById('parfumImage').value = '';
    document.getElementById('imagePreview').style.display = 'none';
  }

  closeModal() {
    const modal = document.getElementById('parfumModal');
    if (modal) {
      modal.classList.remove('active');
    }
  }

  // Promotions Management
  showPromotions() {
    this.currentPage = 'promotions';
    this.render();
    this.loadPromotions();
  }

  getPromotionsContent() {
    return `
      <div class="table-container">
        <div class="table-header">
          <div class="table-title">Promotions Management</div>
          <button class="add-btn" onclick="app.showCreatePromotionForm()">+ Create Promotion</button>
        </div>
        <table id="promotionsTable">
          <thead>
            <tr>
              <th>ID</th>
              <th>Parfum</th>
              <th>Discount (%)</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="promotionsTableBody">
            <tr><td colspan="7">Loading...</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Create Promotion Modal -->
      <div id="promotionModal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="promotionModalTitle">Create Promotion</h3>
            <button class="close-btn" onclick="app.closePromotionModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Select Parfum</label>
              <select id="promotionParfumId" required>
                <option value="">Loading parfums...</option>
              </select>
            </div>
            <div class="form-group">
              <label>Discount Percentage</label>
              <input type="number" id="promotionDiscount" min="1" max="90" placeholder="e.g., 20" required>
            </div>
            <div class="form-group">
              <label>Start Date</label>
              <input type="date" id="promotionStartDate" required>
            </div>
            <div class="form-group">
              <label>End Date</label>
              <input type="date" id="promotionEndDate" required>
            </div>
            <div class="form-group">
              <label>Description (Optional)</label>
              <textarea id="promotionDescription" placeholder="Promotion description..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="cancel-btn" onclick="app.closePromotionModal()">Cancel</button>
            <button class="submit-btn" onclick="app.handleCreatePromotion()">Create Promotion</button>
          </div>
        </div>
      </div>
    `;
  }

  async loadPromotions() {
    try {
      const response = await fetch(`${API_URL}/admin/promotions`);
      const promotions = await response.json();
      this.displayPromotions(promotions);
    } catch (error) {
      console.error('Error loading promotions:', error);
      document.getElementById('promotionsTableBody').innerHTML = '<tr><td colspan="7">Error loading promotions</td></tr>';
    }
  }

  displayPromotions(promotions) {
    const tbody = document.getElementById('promotionsTableBody');
    if (promotions.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7">No promotions found</td></tr>';
      return;
    }

    tbody.innerHTML = promotions.map(promo => `
      <tr>
        <td>${promo.id}</td>
        <td>${promo.parfum_nom}</td>
        <td>${promo.discount_percentage}%</td>
        <td>${new Date(promo.start_date).toLocaleDateString()}</td>
        <td>${new Date(promo.end_date).toLocaleDateString()}</td>
        <td><span class="status ${promo.is_active ? 'active' : 'inactive'}">${promo.is_active ? 'Active' : 'Inactive'}</span></td>
        <td>
          <button class="edit-btn" onclick="app.editPromotion(${promo.id})">Edit</button>
          <button class="delete-btn" onclick="app.deletePromotion(${promo.id})">Delete</button>
        </td>
      </tr>
    `).join('');
  }

  async showCreatePromotionForm() {
    // Load parfums for dropdown
    try {
      const response = await fetch(`${API_URL}/parfums`);
      const parfums = await response.json();
      
      const select = document.getElementById('promotionParfumId');
      select.innerHTML = '<option value="">Select a parfum...</option>' + 
        parfums.map(parfum => `<option value="${parfum.id}">${parfum.nom} - ${parfum.marque}</option>`).join('');
      
      // Set default dates
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      document.getElementById('promotionStartDate').value = today;
      document.getElementById('promotionEndDate').value = nextWeek;
      
      document.getElementById('promotionModal').classList.add('active');
    } catch (error) {
      console.error('Error loading parfums:', error);
      alert('Error loading parfums');
    }
  }

  async handleCreatePromotion() {
    const parfumId = document.getElementById('promotionParfumId').value;
    const discount = document.getElementById('promotionDiscount').value;
    const startDate = document.getElementById('promotionStartDate').value;
    const endDate = document.getElementById('promotionEndDate').value;
    const description = document.getElementById('promotionDescription').value;

    if (!parfumId || !discount || !startDate || !endDate) {
      alert('Please fill all required fields');
      return;
    }

    if (parseInt(discount) < 1 || parseInt(discount) > 90) {
      alert('Discount must be between 1% and 90%');
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      alert('End date must be after start date');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/promotions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parfum_id: parfumId,
          discount_percentage: discount,
          start_date: startDate,
          end_date: endDate,
          description: description
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('Promotion created successfully!');
        this.closePromotionModal();
        this.loadPromotions();
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      console.error('Error creating promotion:', error);
      alert('Error creating promotion');
    }
  }

  closePromotionModal() {
    document.getElementById('promotionModal').classList.remove('active');
    // Reset form
    document.getElementById('promotionParfumId').value = '';
    document.getElementById('promotionDiscount').value = '';
    document.getElementById('promotionStartDate').value = '';
    document.getElementById('promotionEndDate').value = '';
    document.getElementById('promotionDescription').value = '';
  }

  async deletePromotion(id) {
    if (!confirm('Are you sure you want to delete this promotion?')) return;

    try {
      const response = await fetch(`${API_URL}/admin/promotions/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.success) {
        alert('Promotion deleted successfully!');
        this.loadPromotions();
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      console.error('Error deleting promotion:', error);
      alert('Error deleting promotion');
    }
  }

  editPromotion(id) {
    alert('Edit promotion #' + id + ' (Feature coming soon)');
  }

  // ============================================
  // FONCTION SIMPLE POUR LES ÉTOILES
  // ============================================

  renderStars(note) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= note) {
        stars += '<span style="color: #ffc107;">⭐</span>';
      } else {
        stars += '<span style="color: #ddd;">☆</span>';
      }
    }
    return stars;
  }
}

// Initialize app
const app = new AdminApp();
