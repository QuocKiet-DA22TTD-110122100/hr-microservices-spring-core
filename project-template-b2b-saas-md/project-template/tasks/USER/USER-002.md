# 📌 USER-002 — Lister les utilisateurs d'un tenant (avec pagination)

**Module** : user-service
**Agent assigné** : Backend Agent + Frontend Agent
**Priorité** : 🟠 High
**Statut** : [ ] À faire
**Dépend de** : USER-001

---

## Spécification Backend

```
GET /users?page=1&limit=20&role=MEMBER&search=alice
Auth: Bearer JWT
Permission: TENANT_ADMIN, MANAGER

Response 200:
{
  "data": [ { ...UserResponseDto } ],
  "meta": {
    "total": 142,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

## Spécification Frontend

Page : `UserListPage`
Composants requis :
- `UserTable` (organism) — tableau paginé
- `UserFilters` (molecule) — filtres par rôle et recherche
- `UserCard` (molecule) — version mobile
- `Pagination` (molecule) — navigation pages

---

## Checklist Backend

### 📖 Analyse
- [ ] Lire BR-001 (isolation tenant) dans business-rules.md
- [ ] Lire DEC-004 (RLS) dans project-memory.md

### ⚙️ Backend
- [ ] `ListUsersQueryDto` : page, limit, role (optionnel), search (optionnel)
- [ ] `PaginatedUsersDto` : data[], meta (total, page, limit, totalPages)
- [ ] `UserService.listUsers()` — filtre automatique par tenant_id (RLS)
- [ ] Index DB : `(tenant_id, status, role)` pour les filtres combinés
- [ ] Cache Redis : résultats mis en cache 60s par (tenantId + queryParams)

### 🧪 Tests Backend
- [ ] Retourne seulement les utilisateurs du tenant courant (isolation BR-001)
- [ ] Pagination correcte (page 1, page 2, page hors limites)
- [ ] Filtre par rôle fonctionnel
- [ ] Recherche par email/nom fonctionnelle
- [ ] MEMBER qui appelle → HTTP 403

---

## Checklist Frontend

### 🖥 Frontend
- [ ] Hook `useUsers(tenantId, filters)` avec états loading/error/success
- [ ] Composant `UserTable` avec colonnes : nom, email, rôle, statut, date création
- [ ] Filtre par rôle (select) + recherche (input debounced 300ms)
- [ ] Pagination UI avec navigation
- [ ] État vide (aucun utilisateur)
- [ ] État erreur avec message et bouton retry
- [ ] Responsive : tableau sur desktop, cards sur mobile

### 🧪 Tests Frontend
- [ ] Affichage correct des données
- [ ] Filtre par rôle met à jour la liste
- [ ] Pagination navigable
- [ ] État loading visible pendant le fetch
- [ ] État error affiché si l'API échoue

### ✅ Critères d'acceptation
- [ ] HTTP 200 avec pagination correcte
- [ ] Isolation tenant : 0 donnée d'un autre tenant possible
- [ ] Performance : p95 < 100ms (avec index et cache)
- [ ] UI : tableau fonctionnel avec filtres
