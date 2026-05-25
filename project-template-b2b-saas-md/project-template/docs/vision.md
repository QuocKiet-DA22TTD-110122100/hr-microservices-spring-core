# 🎯 Project Vision
> ⚠️ INSTRUCTION AGENT : Lire ce fichier EN PREMIER avant toute action.

---

## Nom du projet
**B2B SaaS Platform** — Plateforme enterprise multi-tenant

## Objectifs métier
- Fournir une plateforme SaaS sécurisée à des clients B2B (tenants)
- Gérer les utilisateurs, rôles et permissions par organisation
- Facturation par abonnement (plans Free / Pro / Enterprise)
- Intégrations SSO pour les clients enterprise
- Conformité ISO 27001 et SOC 2 Type II

## Utilisateurs cibles
| Rôle | Description |
|------|-------------|
| `SUPER_ADMIN` | Équipe interne — gestion de la plateforme |
| `TENANT_ADMIN` | Admin d'une organisation cliente |
| `MANAGER` | Manager au sein d'un tenant |
| `MEMBER` | Utilisateur standard |

## Tech Stack
| Couche | Technologie |
|--------|-------------|
| Frontend | React 18 + TypeScript + Vite |
| Backend | NestJS + TypeScript |
| Base de données | PostgreSQL 15 (par service) |
| Cache | Redis 7 |
| Messaging | Kafka (async) + REST (sync) |
| Auth | Keycloak (OAuth2 / OIDC / SAML) |
| Infra | Kubernetes (EKS) + Terraform |
| CI/CD | GitHub Actions + ArgoCD |
| Secrets | HashiCorp Vault |
| Observabilité | Datadog + OpenTelemetry |

## Architecture
- Pattern : **Microservices** avec API Gateway centralisé
- Isolation : **Database-per-service**
- Communication : **REST** (sync) + **Kafka** (async)
- Sécurité réseau : **Istio mTLS** entre tous les services
- Multi-tenant : **Row-Level Security** (PostgreSQL RLS)

## Services principaux
| Service | Port | Responsabilité |
|---------|------|----------------|
| `api-gateway` | 3000 | Routing, Auth, Rate limiting, Audit |
| `auth-service` | 3001 | OAuth2, OIDC, SAML, MFA, tokens |
| `user-service` | 3002 | Utilisateurs, RBAC, SCIM |
| `tenant-service` | 3003 | Organisations, plans, onboarding |
| `billing-service` | 3004 | Abonnements, paiements (Stripe) |
| `notification-service` | 3005 | Email, in-app, webhooks |

## Contraintes de conformité
- **ISO 27001** : A.9 (accès), A.10 (chiffrement), A.12 (opérations), A.13 (réseau), A.14 (dev)
- **SOC 2 Type II** : CC6 (accès logique), CC7 (monitoring), CC8 (changements)
- Logs d'audit **immuables** (WORM), rétention **1 an minimum**
- Chiffrement **AES-256** at-rest, **TLS 1.3** in-transit
- Secrets via **Vault** — rotation automatique 90 jours
