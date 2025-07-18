# Mises à jour du guide frontend API

## Version 2.1.0 - 15 Janvier 2024

### 🆕 Nouvelles fonctionnalités documentées

#### 1. **Changement de propriétaire des piscines**
- **Endpoint** : `PUT /api/pools/:id`
- **Nouveau champ** : `owner` (User ID)
- **Validation** : Vérifie que le nouveau propriétaire existe
- **Accès** : Admin ou propriétaire actuel de la piscine

**Exemple d'utilisation :**
```javascript
// Changer le propriétaire d'une piscine
const response = await axios.put('/api/pools/60d21b4667d0d8992e610c85', {
  owner: '60d21b4667d0d8992e610c86'
}, {
  headers: { Authorization: `Bearer ${token}` }
});
```

#### 2. **Mise à jour d'utilisateur par l'administrateur**
- **Endpoint** : `PUT /api/admin/users/:id`
- **Champs modifiables** : `name`, `username`, `email`, `role`, `phone`, `consentGiven`
- **Validation** : Vérifie l'unicité username/email
- **Accès** : Administrateurs uniquement

**Exemple d'utilisation :**
```javascript
// Mettre à jour un utilisateur en tant qu'admin
const response = await axios.put('/api/admin/users/60d21b4667d0d8992e610c85', {
  name: 'John Doe Updated',
  role: 'admin',
  consentGiven: true
}, {
  headers: { Authorization: `Bearer ${adminToken}` }
});
```

### 📝 Modifications apportées au guide

#### 1. **Section Admin mise à jour**
- ✅ Ajout de l'endpoint `updateUser`
- ✅ Documentation complète des paramètres
- ✅ Exemples de réponses
- ✅ Gestion des erreurs

#### 2. **Section Pools mise à jour**
- ✅ Ajout du champ `owner` dans la mise à jour
- ✅ Documentation de la validation du nouveau propriétaire
- ✅ Exemples de réponses avec données du propriétaire

#### 3. **Nouvelles sections ajoutées**
- ✅ **`newFeatures`** : Documentation des nouvelles fonctionnalités
- ✅ **`usageExamples`** : Exemples d'utilisation en JavaScript
- ✅ **`changelog`** : Historique des versions

### 🔧 Améliorations techniques

#### 1. **Validation renforcée**
- Vérification de l'existence des utilisateurs
- Validation d'unicité username/email
- Gestion des conflits de données

#### 2. **Gestion d'erreur améliorée**
- Codes d'erreur spécifiques (404, 400, 401, 403)
- Messages d'erreur explicites
- Documentation des réponses d'erreur

#### 3. **Sécurité**
- Autorisation stricte pour les fonctions admin
- Validation des permissions par rôle
- Protection contre les modifications non autorisées

### 📊 Structure des données mises à jour

#### Réponse de mise à jour de piscine
```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "name": "Pool Name",
    "address": "Pool Address",
    "owner": {
      "_id": "60d21b4667d0d8992e610c86",
      "name": "New Owner Name",
      "email": "newowner@example.com"
    },
    "type": "residential",
    "status": "active"
  }
}
```

#### Réponse de mise à jour d'utilisateur
```json
{
  "success": true,
  "message": "User updated successfully",
  "user": {
    "_id": "60d21b4667d0d8992e610c85",
    "name": "John Doe Updated",
    "username": "johndoe_updated",
    "email": "john.updated@example.com",
    "role": "admin",
    "phone": "+1234567890",
    "consentGiven": true,
    "consentDate": "2024-01-15T10:30:00.000Z"
  }
}
```

### 🚀 Utilisation recommandée

#### Pour les développeurs frontend

1. **Changement de propriétaire de piscine**
   - Vérifier que l'utilisateur a les permissions nécessaires
   - Valider l'ID du nouveau propriétaire côté client
   - Gérer les erreurs 404 (nouveau propriétaire inexistant)

2. **Mise à jour d'utilisateur par admin**
   - Vérifier que l'utilisateur connecté est admin
   - Valider les données avant envoi
   - Gérer les conflits username/email

#### Exemples d'intégration

```javascript
// Service pour la gestion des piscines
class PoolService {
  async changeOwner(poolId, newOwnerId, token) {
    try {
      const response = await axios.put(`/api/pools/${poolId}`, {
        owner: newOwnerId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Nouveau propriétaire non trouvé');
      }
      throw error;
    }
  }
}

// Service pour la gestion des utilisateurs (admin)
class AdminUserService {
  async updateUser(userId, userData, adminToken) {
    try {
      const response = await axios.put(`/api/admin/users/${userId}`, userData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 400) {
        throw new Error('Données invalides ou conflit username/email');
      }
      throw error;
    }
  }
}
```

### 📋 Checklist pour l'implémentation frontend

- [ ] Intégrer le changement de propriétaire dans l'interface de gestion des piscines
- [ ] Ajouter la fonctionnalité de mise à jour d'utilisateur dans le panel admin
- [ ] Implémenter la validation côté client
- [ ] Gérer les erreurs et afficher des messages appropriés
- [ ] Tester les nouvelles fonctionnalités
- [ ] Mettre à jour la documentation utilisateur

### 🔗 Liens utiles

- **Guide API complet** : `frontend-api-guide.json`
- **Documentation backend** : `POOL_OWNER_CHANGE_FIX.md`
- **Documentation admin** : `ADMIN_USER_UPDATE_FEATURE.md`
- **Tests** : `test_pool_owner_change.js`, `test_admin_user_update.js` 