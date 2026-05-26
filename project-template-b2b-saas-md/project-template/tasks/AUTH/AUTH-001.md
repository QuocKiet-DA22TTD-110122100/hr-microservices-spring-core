# 📌 AUTH-001 — Implémenter l'authentification OAuth2 + OIDC

**Module** : auth-service
**Agent assigné** : Backend Agent
**Priorité** : 🔴 Critical
**Statut** : [ ] À faire

---

## Contexte

Mettre en place le flux d'authentification complet. C'est la fondation de toute la sécurité plateforme. Aucun autre service ne peut fonctionner sans ce service.

**Context Pack à charger** :
- `docs/vision.md`
- `docs/business-rules.md` (BR-003, BR-004, BR-005)
- `docs/project-memory.md` (DEC-001, DEC-002)
- `docs/coding-standards.md`
- Ce fichier `task.md`

---

## Spécification

### Endpoint 1 — Login
```
POST /auth/login

Request:
{
  "email": "admin@company.com",
  "password": "...",
  "tenantSlug": "acme-corp",
  "mfaCode": "123456"  // requis si rôle ADMIN
}

Response 200:
{
  "accessToken": "eyJ...",    // JWT RS256, expiry 15min
  "refreshToken": "uuid-v4",  // stocké en DB Redis, expiry 7j
  "user": {
    "id": "uuid",
    "email": "...",
    "role": "TENANT_ADMIN",
    "tenantId": "uuid"
  }
}

Errors:
401 — Identifiants incorrects
423 — Compte verrouillé (BR-005)
403 — MFA requis mais non fourni (BR-003)
```

### Endpoint 2 — Refresh token
```
POST /auth/refresh
Body: { "refreshToken": "uuid-v4" }
Response 200: { "accessToken": "eyJ..." }
Errors: 401 — Token invalide ou expiré
```

### Endpoint 3 — Logout
```
POST /auth/logout
Headers: Authorization: Bearer <token>
Action: Invalider le refreshToken dans Redis
Response 204
```

### Endpoint 4 — JWKS (clés publiques)
```
GET /.well-known/jwks.json
Public — pas d'auth requise
Utilisé par les autres services pour vérifier les JWT
```

---

## Règles métier applicables

- **BR-003** : MFA obligatoire pour TENANT_ADMIN et SUPER_ADMIN
- **BR-004** : Révocation immédiate si compte désactivé
- **BR-005** : Verrouillage après 5 tentatives échouées / 15min
- **DEC-001** : JWT signé RS256
- **DEC-002** : Refresh tokens stockés dans Redis

---

## Checklist d'implémentation

### 📖 Analyse
- [ ] Lire BR-003, BR-004, BR-005 dans business-rules.md
- [ ] Lire DEC-001 et DEC-002 dans project-memory.md

### ⚙️ Backend
- [ ] `LoginDto` avec validations (email, tenantSlug, mfaCode optionnel)
- [ ] `AuthResponseDto` (accessToken, refreshToken, user)
- [ ] `AuthService.login()` — vérification password + MFA + verrouillage
- [ ] `AuthService.refresh()` — rotation du refresh token
- [ ] `AuthService.logout()` — invalidation Redis
- [ ] Génération JWT RS256 (clés depuis Vault)
- [ ] Endpoint JWKS public

### 🗄️ Base de données
- [ ] Table `failed_login_attempts` (user_id, ip, timestamp)
- [ ] Table `account_locks` (user_id, locked_until)
- [ ] Index : `user_id`, `tenant_id`

### 🔴 Redis
- [ ] Stocker refresh_token avec TTL 7j
- [ ] Stocker compteur de tentatives échouées avec TTL 15min
- [ ] Stocker liste noire de tokens révoqués

### 📋 Audit Log (BR-006)
- [ ] Événement : `auth.login.success`
- [ ] Événement : `auth.login.failed`
- [ ] Événement : `auth.account.locked`
- [ ] Événement : `auth.logout`

### 🧪 Tests
- [ ] Test login success (rôle MEMBER)
- [ ] Test login success avec MFA (rôle ADMIN)
- [ ] Test login sans MFA → refus (BR-003)
- [ ] Test verrouillage après 5 tentatives (BR-005)
- [ ] Test refresh token rotation
- [ ] Test logout + invalidation
- [ ] Test IDOR : token d'un autre tenant → 401
- [ ] Coverage > 80%

### ✅ Critères d'acceptation
- [ ] HTTP 200 + tokens valides en cas de succès
- [ ] HTTP 401 si credentials incorrects
- [ ] HTTP 423 si compte verrouillé
- [ ] Audit log écrit pour chaque tentative
- [ ] Notification email envoyée en cas de verrouillage
