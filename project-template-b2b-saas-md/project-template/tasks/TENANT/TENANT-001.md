# 📌 TENANT-001 — Créer un nouveau tenant (onboarding)

**Module** : tenant-service
**Agent assigné** : Backend Agent
**Priorité** : 🔴 Critical
**Statut** : [ ] À faire
**Dépend de** : AUTH-001

---

## Contexte

Permettre à un `SUPER_ADMIN` de créer une nouvelle organisation cliente (tenant). C'est le point d'entrée du processus d'onboarding. La création d'un tenant déclenche une chaîne d'événements.

**Context Pack à charger** :
- `docs/vision.md`
- `docs/business-rules.md` (BR-001, BR-002, BR-006)
- `docs/project-memory.md` (DEC-003, DEC-004)
- `docs/coding-standards.md`
- Ce fichier `task.md`

---

## Spécification

```
POST /tenants
Auth: Bearer JWT
Permission: SUPER_ADMIN uniquement

Request:
{
  "name":    "Acme Corporation",
  "slug":    "acme-corp",        // unique, URL-safe
  "plan":    "pro",
  "adminEmail": "admin@acme.com"
}

Response 201:
{
  "id":        "uuid",
  "name":      "Acme Corporation",
  "slug":      "acme-corp",
  "plan":      "pro",
  "status":    "ACTIVE",
  "createdAt": "ISO 8601"
}
```

---

## Règles métier applicables

- **BR-001** : Ce tenant sera le conteneur isolé de toutes ses données
- **BR-002** : Les données appartiennent au tenant
- **BR-006** : Audit log obligatoire
- **DEC-003** : Événements Kafka pour déclencher les actions downstream

---

## Chaîne d'événements après création

```
tenant.created (Kafka)
   │
   ├──▶ user-service         : Créer le compte TENANT_ADMIN
   ├──▶ notification-service : Envoyer email de bienvenue
   └──▶ billing-service      : Initialiser le compte Stripe
```

---

## Checklist d'implémentation

### 📖 Analyse
- [ ] Lire BR-001, BR-002, BR-006 dans business-rules.md
- [ ] Lire DEC-003, DEC-004 dans project-memory.md

### ⚙️ Backend
- [ ] `CreateTenantDto` : name, slug (regex: `^[a-z0-9-]+$`), plan, adminEmail
- [ ] `TenantResponseDto` : id, name, slug, plan, status, createdAt
- [ ] `TenantService.createTenant()` :
  1. Valider unicité du slug
  2. Créer le tenant
  3. Publier `tenant.created` sur Kafka
  4. Écrire audit log
- [ ] Guard : SUPER_ADMIN uniquement

### 🗄️ Base de données
- [ ] Entity `Tenant` : id, name, slug, plan, status, createdAt, updatedAt, createdBy
- [ ] Contrainte UNIQUE sur slug
- [ ] Index sur slug, status
- [ ] Migration PostgreSQL

### 📨 Kafka
- [ ] Publier `tenant.created` : tenantId, name, slug, plan, adminEmail

### 📋 Audit Log
- [ ] `tenant.created` avec actorId (SUPER_ADMIN), tenantId

### 🧪 Tests
- [ ] Création réussie → 201 + tenant en DB
- [ ] Slug dupliqué → 409
- [ ] Slug invalide (espaces, majuscules) → 400
- [ ] TENANT_ADMIN qui tente → 403
- [ ] Événement Kafka publié
- [ ] Audit log créé
- [ ] Coverage > 80%

### ✅ Critères d'acceptation
- [ ] HTTP 201 avec tenantId
- [ ] Slug unique et URL-safe
- [ ] Événement Kafka publié → admin créé automatiquement
- [ ] Audit log immédiat
