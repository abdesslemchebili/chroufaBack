# Fonctionnalité de mise à jour d'utilisateur par l'administrateur

## Problème identifié

Il n'existait pas de fonction permettant aux administrateurs de modifier les données des utilisateurs. Les seules fonctionnalités disponibles étaient :

1. **Création d'utilisateurs** par l'admin (`POST /api/admin/users`)
2. **Suppression d'utilisateurs** par l'admin (`DELETE /api/admin/users/:id`)
3. **Listage des utilisateurs** par l'admin (`GET /api/admin/users`)
4. **Mise à jour du profil personnel** par l'utilisateur lui-même (`PUT /api/auth/profile`)

## Solution implémentée

### 1. Nouvelle fonction de contrôleur (`controllers/adminController.js`)

Ajout de la fonction `updateUser` qui permet aux administrateurs de modifier tous les champs d'un utilisateur :

```javascript
// @desc    Update user (admin only)
// @route   PUT /api/admin/users/:id
// @access  Admin
exports.updateUser = async (req, res, next) => {
  // Logique de mise à jour avec validation des conflits
  // et gestion d'erreur appropriée
};
```

### 2. Nouvelles règles de validation (`middleware/validation.js`)

Création de `userUpdateValidationRules()` spécifiquement pour la mise à jour d'utilisateur par l'admin :

```javascript
exports.userUpdateValidationRules = () => {
  return [
    body('name', 'Name is required').optional().notEmpty(),
    body('username', 'Username is required')
      .optional()
      .notEmpty()
      .isLength({ min: 3, max: 30 })
      .matches(/^[a-zA-Z0-9_]+$/),
    body('email', 'Please include a valid email')
      .optional()
      .isEmail(),
    body('role', 'Role must be user or admin')
      .optional()
      .isIn(['user', 'admin']),
    body('phone', 'Phone must be a string')
      .optional()
      .isString(),
    body('consentGiven', 'Consent must be explicitly given as true or false')
      .optional()
      .isBoolean()
  ];
};
```

### 3. Route mise à jour (`routes/admin.js`)

Ajout de la route PUT pour la mise à jour d'utilisateur :

```javascript
router.put('/users/:id', protect, authorize('admin'), userUpdateValidationRules(), validate, updateUser);
```

## Fonctionnalités ajoutées

### ✅ **Champs modifiables par l'admin**

- **`name`** : Nom complet de l'utilisateur
- **`username`** : Nom d'utilisateur (avec validation d'unicité)
- **`email`** : Adresse email (avec validation d'unicité)
- **`role`** : Rôle de l'utilisateur (`user` ou `admin`)
- **`phone`** : Numéro de téléphone
- **`consentGiven`** : Consentement de l'utilisateur (met à jour automatiquement `consentDate`)

### ✅ **Validations et sécurité**

1. **Vérification d'existence** : L'utilisateur doit exister
2. **Validation d'unicité** : Vérification des conflits username/email
3. **Validation des rôles** : Seuls `user` et `admin` sont autorisés
4. **Autorisation** : Seuls les administrateurs peuvent utiliser cette fonction
5. **Validation MongoDB ID** : Vérification de la validité de l'ID utilisateur

### ✅ **Gestion d'erreur**

- **404** : Utilisateur non trouvé
- **400** : Données invalides ou conflits username/email
- **401** : Non authentifié
- **403** : Non autorisé (pas admin)

## Utilisation

### Exemple de requête complète

```bash
PUT /api/admin/users/:userId
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "John Doe Updated",
  "username": "johndoe_updated",
  "email": "john.updated@example.com",
  "role": "admin",
  "phone": "+1234567890",
  "consentGiven": true
}
```

### Exemple de mise à jour partielle

```bash
PUT /api/admin/users/:userId
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "John Doe Updated",
  "role": "user"
}
```

### Réponse en cas de succès

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
    "consentDate": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Réponse en cas d'erreur (conflit username)

```json
{
  "success": false,
  "message": "User with this username already exists"
}
```

## Tests

Un script de test complet a été créé (`test_admin_user_update.js`) qui vérifie :

1. ✅ Création d'un utilisateur admin de test
2. ✅ Connexion en tant qu'admin
3. ✅ Création d'un utilisateur de test
4. ✅ Vérification des données initiales
5. ✅ Mise à jour complète de l'utilisateur
6. ✅ Vérification de tous les champs mis à jour
7. ✅ Test de mise à jour partielle
8. ✅ Test avec ID utilisateur invalide
9. ✅ Test de conflit de nom d'utilisateur
10. ✅ Nettoyage des données de test

### Exécution des tests

```bash
node test_admin_user_update.js
```

## Différences avec la mise à jour de profil personnel

| Aspect | Mise à jour personnelle (`/api/auth/profile`) | Mise à jour admin (`/api/admin/users/:id`) |
|--------|-----------------------------------------------|--------------------------------------------|
| **Accès** | Utilisateur lui-même | Administrateurs uniquement |
| **Champs modifiables** | `name`, `phone` uniquement | Tous les champs sauf `password` |
| **Changement de rôle** | ❌ Impossible | ✅ Possible |
| **Changement de username** | ❌ Impossible | ✅ Possible |
| **Changement d'email** | ❌ Impossible | ✅ Possible |
| **Validation d'unicité** | ❌ Non applicable | ✅ Vérification des conflits |

## Sécurité

- **Autorisation stricte** : Seuls les administrateurs peuvent accéder
- **Validation des données** : Toutes les entrées sont validées
- **Gestion des conflits** : Prévention des doublons username/email
- **Pas de modification de mot de passe** : Sécurité renforcée (utiliser la route dédiée)

## Compatibilité

Cette nouvelle fonctionnalité est entièrement rétrocompatible et n'affecte pas les fonctionnalités existantes. Les utilisateurs peuvent toujours modifier leur propre profil via `/api/auth/profile`. 