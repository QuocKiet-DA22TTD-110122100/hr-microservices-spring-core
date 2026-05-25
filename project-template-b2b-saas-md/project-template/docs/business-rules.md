# 📋 Business Rules
> ⚠️ INSTRUCTION AGENT : Ces règles priment sur tout choix technique. Ne jamais contourner.

---

## Isolation & Tenant

### BR-001 — Isolation stricte des tenants
Un utilisateur appartient à **un seul tenant**.
- Toute requête inter-tenant est **interdite**, même pour SUPER_ADMIN via l'API normale
- Le `tenant_id` doit être vérifié **côté application ET côté base de données** (RLS)
- Violation = incident de sécurité critique (alerte SIEM immédiate)

### BR-002 — Propriété des données
Les données sont la propriété du **tenant**, pas de la plateforme.
- En cas de résiliation : export des données dans les **30 jours**
- Suppression certifiée (avec preuve écrite) dans les **60 jours**
- Aucune utilisation des données d'un tenant pour entraîner des modèles

---

## Authentification & Accès

### BR-003 — MFA obligatoire pour les admins
Tout compte avec rôle `TENANT_ADMIN` ou `SUPER_ADMIN` doit avoir le MFA activé.
- Sans MFA : accès refusé aux actions sensibles (même si le token est valide)
- Codes de secours : 8 codes à usage unique, stockés hashés (bcrypt)

### BR-004 — Révocation immédiate
Un compte désactivé ou supprimé doit perdre **tous ses accès immédiatement**.
- Invalider les tokens JWT dans Redis
- Publier l'événement `user.account.deactivated` sur Kafka
- Les sessions actives se terminent dans les **30 secondes**

### BR-005 — Tentatives de connexion
Après **5 échecs consécutifs** : compte verrouillé pour **15 minutes**.
- Notification email envoyée au propriétaire du compte
- Événement dans l'audit log
- Déverrouillage possible par TENANT_ADMIN uniquement

---

## Audit & Traçabilité

### BR-006 — Audit log obligatoire
Toute action sensible génère une entrée d'audit **immuable**.
Actions concernées : login/logout, création/modification/suppression d'utilisateur, changement de rôle, accès aux données de facturation, export de données.

Format obligatoire :
```json
{
  "event_id": "uuid",
  "timestamp": "ISO 8601",
  "actor_id": "user_uuid",
  "actor_email": "user@company.com",
  "tenant_id": "tenant_uuid",
  "action": "user.role.changed",
  "resource_type": "user",
  "resource_id": "target_user_uuid",
  "ip_address": "1.2.3.4",
  "user_agent": "...",
  "result": "success | failure",
  "metadata": {}
}
```

### BR-007 — Rétention des logs
- Audit logs : **1 an minimum** (WORM — immuable)
- Logs applicatifs : **90 jours**
- Logs d'erreur : **180 jours**

---

## Facturation

### BR-008 — Changement de plan
Un downgrade de plan prend effet à la **fin de la période de facturation** en cours.
- Jamais de downgrade immédiat (impact utilisateurs)
- Notifier le TENANT_ADMIN 7 jours avant

### BR-009 — Données de paiement
Aucune donnée de carte bancaire ne doit être stockée dans nos bases.
- Délégation totale à **Stripe**
- Seul le `stripe_customer_id` et `stripe_subscription_id` sont stockés

---

## Permissions (RBAC)

| Action | SUPER_ADMIN | TENANT_ADMIN | MANAGER | MEMBER |
|--------|:-----------:|:------------:|:-------:|:------:|
| Créer un tenant | ✅ | ❌ | ❌ | ❌ |
| Créer un utilisateur | ✅ | ✅ | ❌ | ❌ |
| Modifier les rôles | ✅ | ✅ | ❌ | ❌ |
| Voir les membres | ✅ | ✅ | ✅ | ❌ |
| Accéder à la facturation | ✅ | ✅ | ❌ | ❌ |
| Exporter les données | ✅ | ✅ | ❌ | ❌ |
| Modifier son profil | ✅ | ✅ | ✅ | ✅ |
