# 📌 BILLING-001 — Créer un abonnement Stripe pour un tenant

**Module** : billing-service
**Agent assigné** : Backend Agent
**Priorité** : 🟠 High
**Statut** : [ ] À faire
**Dépend de** : TENANT-001 (tenant doit exister)

---

## Contexte

Permettre à un tenant nouvellement créé de souscrire à un plan payant. La gestion des données de paiement est entièrement déléguée à Stripe (BR-009).

**Context Pack à charger** :
- `docs/vision.md`
- `docs/business-rules.md` (BR-008, BR-009)
- `docs/project-memory.md` (DEC-001, DEC-003)
- `context-packs/billing-pack.md`
- Ce fichier `task.md`

---

## Spécification

```
POST /billing/subscriptions
Auth: Bearer JWT
Permission: TENANT_ADMIN uniquement

Request:
{
  "planId": "pro-monthly",
  "paymentMethodId": "pm_stripe_xxx"  // Stripe Payment Method ID
}

Response 201:
{
  "subscriptionId": "uuid",
  "stripeSubscriptionId": "sub_xxx",
  "plan": "pro-monthly",
  "status": "active",
  "currentPeriodEnd": "ISO 8601",
  "amount": 4900,
  "currency": "usd"
}
```

---

## Règles métier applicables

- **BR-008** : Downgrade prend effet en fin de période, jamais immédiatement
- **BR-009** : Aucune donnée de carte stockée — délégation Stripe totale
- **DEC-003** : Événement `billing.subscription.created` publié sur Kafka

---

## Checklist d'implémentation

### 📖 Analyse
- [ ] Lire BR-008 et BR-009 dans business-rules.md
- [ ] Lire DEC-003 dans project-memory.md

### ⚙️ Backend
- [ ] `CreateSubscriptionDto` : planId, paymentMethodId
- [ ] `SubscriptionResponseDto` : subscriptionId, stripeSubscriptionId, plan, status, currentPeriodEnd
- [ ] `BillingService.createSubscription()` :
  1. Vérifier qu'il n'existe pas déjà une subscription active pour ce tenant
  2. Appeler Stripe API (créer customer + subscription)
  3. Sauvegarder en DB : tenantId, stripeCustomerId, stripeSubscriptionId, plan, status
  4. Publier événement Kafka
  5. Écrire audit log

### 🗄️ Base de données
- [ ] Entity `Subscription` : id, tenantId, stripeCustomerId, stripeSubscriptionId, plan, status, currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd
- [ ] ⚠️ Aucune donnée de carte (BR-009)
- [ ] Migration PostgreSQL
- [ ] Index sur tenantId, stripeSubscriptionId

### 📨 Kafka
- [ ] Publier `billing.subscription.created` : tenantId, plan, status

### 📋 Audit Log
- [ ] `billing.subscription.created` avec actorId, tenantId, plan

### 🧪 Tests
- [ ] Création réussie → 201 + subscription en DB
- [ ] Subscription déjà active → 409
- [ ] paymentMethodId invalide (Stripe error) → 402
- [ ] MEMBER qui tente de créer → 403
- [ ] Vérifier qu'aucune carte n'est stockée en DB (BR-009)
- [ ] Événement Kafka publié
- [ ] Audit log créé

### ✅ Critères d'acceptation
- [ ] HTTP 201 avec stripeSubscriptionId
- [ ] Aucune donnée de carte en base (BR-009)
- [ ] Un seul abonnement actif par tenant
- [ ] Événement Kafka publié dans les 2s
