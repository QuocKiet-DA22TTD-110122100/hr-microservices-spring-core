# 📌 USER-001 — Créer un utilisateur dans un tenant

**Module** : user-service
**Agent assigné** : Backend Agent
**Priorité** : 🔴 Critical
**Statut** : [ ] À faire
**Dépend de** : AUTH-001 (authentification requise)

---

## Contexte

Permettre à un `TENANT_ADMIN` de créer un nouvel utilisateur dans son organisation. L'utilisateur reçoit un email d'invitation avec un lien de configuration de mot de passe.

**Context Pack à charger** :
- `docs/vision.md`
- `docs/business-rules.md` (BR-001, BR-002, BR-006)
- `docs/project-memory.md` (DEC-003, DEC-004)
- `docs/coding-standards.md`
- Ce fichier `task.md`

---

## Spécification

```
POST /users
Auth: Bearer JWT
Permission: TENANT_ADMIN uniquement

Request:
{
  "firstName": "Alice",
  "lastName":  "Martin",
  "email":     "alice@company.com",
  "role":      "MEMBER",
  "departmentId": "uuid"
}

Response 201:
{
  "id":        "uuid",
  "email":     "alice@company.com",
  "firstName": "Alice",
  "lastName":  "Martin",
  "role":      "MEMBER",
  "tenantId":  "uuid",
  "status":    "PENDING_INVITATION",
  "createdAt": "ISO 8601"
}

Errors:
400 — Validation échouée
403 — Rôle insuffisant (pas TENANT_ADMIN)
409 — Email déjà utilisé dans ce tenant
```

---

## Règles métier applicables

- **BR-001** : L'utilisateur appartient à UN seul tenant (celui de l'acteur)
- **BR-002** : L'action génère un audit log (BR-006)
- **DEC-003** : Événement `user.account.created` publié sur Kafka
- **DEC-004** : Isolation via tenant_id (RLS PostgreSQL)

---

## Checklist d'implémentation

### 📖 Analyse
- [ ] Lire BR-001 et BR-006 dans business-rules.md
- [ ] Lire DEC-003 et DEC-004 dans project-memory.md

### ⚙️ Backend
- [ ] `CreateUserDto` : email, firstName, lastName, role, departmentId
- [ ] `UserResponseDto` : id, email, name, role, tenantId, status, createdAt
- [ ] `UserService.createUser()` — vérification unicité email/tenant, création, invitation
- [ ] `UserController.create()` — POST /users avec guard TENANT_ADMIN
- [ ] `TenantGuard` — vérifier que le TENANT_ADMIN crée dans son propre tenant
- [ ] Génération du token d'invitation (UUID, expiry 48h)

### 🗄️ Base de données
- [ ] Entity `User` avec champs : id, email, firstName, lastName, role, tenantId, status, inviteToken, inviteExpiresAt, createdAt, updatedAt, createdBy
- [ ] Migration PostgreSQL
- [ ] Contrainte UNIQUE sur (email, tenant_id)
- [ ] Index sur tenant_id, email, status
- [ ] RLS : `tenant_id = current_setting('app.current_tenant')`

### 📨 Kafka
- [ ] Publier `user.account.created` avec : userId, tenantId, email, role, timestamp
- [ ] Le `notification-service` consomme cet événement pour envoyer l'email d'invitation

### 📋 Audit Log (BR-006)
- [ ] Événement : `user.created` avec actorId, tenantId, userId cible, role assigné

### 🧪 Tests
- [ ] Création réussie → HTTP 201 + body correct
- [ ] Email dupliqué dans le même tenant → HTTP 409
- [ ] Email identique dans un autre tenant → HTTP 201 (autorisé)
- [ ] MEMBER qui tente de créer → HTTP 403
- [ ] TENANT_ADMIN créant dans un autre tenant → HTTP 403 (BR-001)
- [ ] Champs manquants → HTTP 400
- [ ] Audit log vérifié après création
- [ ] Événement Kafka publié vérifié
- [ ] Coverage > 80%

### ✅ Critères d'acceptation
- [ ] HTTP 201 avec userId et inviteToken
- [ ] Email unique par tenant (pas global)
- [ ] Événement Kafka publié dans les 2s
- [ ] Audit log créé immédiatement
- [ ] Token d'invitation expiré après 48h
