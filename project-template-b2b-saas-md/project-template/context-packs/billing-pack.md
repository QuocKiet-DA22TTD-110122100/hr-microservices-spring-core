# 📦 Context Pack — Billing Service
> Envoyer UNIQUEMENT ces 5 fichiers à l'agent pour les tâches du billing-service.

---

## Fichiers à inclure dans le prompt de l'agent

1. **`docs/vision.md`** — Vision globale
2. **`docs/business-rules.md`** — Règles : BR-008 (downgrade), BR-009 (données paiement)
3. **`docs/project-memory.md`** — Décisions : DEC-003 (Kafka), DEC-004 (DB isolée)
4. **`docs/coding-standards.md`** — Standards NestJS
5. **`tasks/BILLING/[TASK-ID].md`** — La tâche courante

---

## Résumé des décisions clés pour ce service

| Décision | Valeur |
|----------|--------|
| Provider paiement | Stripe (délégation totale) |
| Données carte stockées | ❌ JAMAIS (BR-009) |
| Données stockées | stripeCustomerId, stripeSubscriptionId uniquement |
| Webhook Stripe | Vérifié via signature (stripe-signature header) |
| Downgrade | Effectif en fin de période (BR-008) |
| Plans disponibles | free, pro-monthly, pro-annual, enterprise |

---

## Endpoints existants
*Aucun — BILLING-001 est la première tâche*

---

## Topics Kafka produits
| Topic | Quand |
|-------|-------|
| `billing.subscription.created` | Abonnement souscrit |
| `billing.subscription.updated` | Plan changé |
| `billing.subscription.cancelled` | Résiliation |
| `billing.payment.failed` | Paiement échoué |

## Topics Kafka consommés
| Topic | Action |
|-------|--------|
| `tenant.created` | Initialiser compte Stripe |
