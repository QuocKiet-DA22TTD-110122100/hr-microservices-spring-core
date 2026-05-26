# 🧠 Project Memory — Décisions Architecturales
> ⚠️ INSTRUCTION AGENT : Lire avant de produire du code. Ajouter toute nouvelle décision ici.

---

## Décisions techniques (DEC)

### DEC-001 — JWT RS256 pour l'authentification
**Décision** : Utiliser JWT signé en RS256 (asymétrique) plutôt que HS256.
**Raison** : Chaque microservice peut vérifier les tokens sans avoir accès au secret de signature. Réduction de la surface d'attaque.
**Impact** : Clé publique exposée via endpoint `/.well-known/jwks.json`. Rotation des clés tous les 90 jours.
**Référence** : ISO A.10, SOC2 CC6

---

### DEC-002 — Redis pour les sessions et la révocation
**Décision** : Stocker les refresh tokens et la liste de révocation dans Redis.
**Raison** : Permettre la révocation immédiate (BR-004) sans attendre l'expiration naturelle du JWT.
**Impact** : Chaque validation de token fait un lookup Redis. TTL = durée du token.
**Référence** : BR-004

---

### DEC-003 — Kafka pour les événements inter-services
**Décision** : Kafka (vs RabbitMQ) pour la communication asynchrone.
**Raison** : Rétention configurable des messages (audit trail naturel), replay possible, partitionnement par tenant_id pour l'ordering.
**Impact** : Chaque service est consumer ET producer. Schéma Avro via Schema Registry.
**Référence** : DEC-007 (audit logs)

---

### DEC-004 — PostgreSQL par service (Database-per-service)
**Décision** : Chaque microservice possède sa propre base PostgreSQL. Aucun accès croisé direct.
**Raison** : Isolation forte des données, déploiement indépendant, RLS par tenant dans chaque BDD.
**Impact** : Pas de JOIN cross-service. Communication via API ou événements Kafka.
**Référence** : BR-001, ISO A.13

---

### DEC-005 — HashiCorp Vault pour tous les secrets
**Décision** : Aucun secret dans le code, les fichiers de config ou les variables CI/CD.
**Raison** : Rotation automatique, audit des accès aux secrets, révocation immédiate possible.
**Impact** : Chaque service utilise le Vault Agent Sidecar. Rotation clés DB : 90 jours.
**Référence** : ISO A.10, SOC2 CC6

---

### DEC-006 — Istio mTLS entre tous les services
**Décision** : Service mesh Istio en mode STRICT mTLS. NetworkPolicy K8s deny-all par défaut.
**Raison** : Zero Trust Network — chaque service authentifie et chiffre, même à l'intérieur du cluster.
**Impact** : Certificats gérés par Istio (renouvellement automatique). Overhead CPU ~1%.
**Référence** : ISO A.13, SOC2 CC6

---

### DEC-007 — Audit logs WORM via Datadog
**Décision** : Logs d'audit envoyés vers Datadog avec politique de rétention WORM 1 an.
**Raison** : Immuabilité garantie pour les audits SOC 2. Format OpenTelemetry standardisé.
**Impact** : Chaque service implémente le AuditLogService. Format JSON structuré (voir BR-006).
**Référence** : BR-006, BR-007, SOC2 CC7

---

### DEC-008 — GitOps strict via ArgoCD
**Décision** : Aucun déploiement manuel en production. Tout passe par des PR avec gates obligatoires.
**Raison** : Traçabilité totale, rollback facile, conformité ISO A.14.
**Impact** : Pipeline bloquant : SAST + scan image + tests integration avant merge.
**Référence** : ISO A.14, SOC2 CC8

---

## À ne PAS faire (anti-patterns)

| ❌ Interdit | ✅ Alternative |
|------------|---------------|
| Accès direct cross-service en DB | Appel REST ou événement Kafka |
| Secret en dur dans le code | HashiCorp Vault |
| `SELECT *` sans `LIMIT` | Pagination obligatoire |
| Données sensibles dans les logs | Masquage via `@Exclude()` |
| JWT sans vérification dans Redis | Toujours vérifier la révocation |
| Déploiement manuel en prod | PR + ArgoCD uniquement |
| `any` en TypeScript | Types stricts obligatoires |
