# 🏗 Architecture Système
> Lire après vision.md. Référence pour tous les agents techniques.

---

## Vue d'ensemble

```
Internet
   │
   ▼
[WAF + CDN]  ← Cloudflare / AWS Shield (TLS 1.3, DDoS, OWASP)
   │
   ▼
[API Gateway]  ← Kong (routing, rate limiting, audit log)
   │
   ├──▶ [Auth Service]         OAuth2 · OIDC · SAML · MFA
   ├──▶ [User Service]         RBAC · SCIM 2.0
   ├──▶ [Tenant Service]       Multi-tenant · Onboarding
   ├──▶ [Billing Service]      Stripe · Plans · Invoices
   └──▶ [Notification Service] Email · Webhooks · In-app
          │
          ▼
     [Kafka Event Bus]  ← Communication asynchrone entre services
          │
          ▼
   [Bases de données]   ← PostgreSQL par service (RLS activé)
   [Redis Cache]        ← Sessions, rate limiting, queues
   [HashiCorp Vault]    ← Secrets, certificats, rotation clés
```

---

## Règles de communication

### REST (synchrone)
- Utilisé pour : réponses temps-réel, validation immédiate
- Authentification : Bearer JWT (vérifié à l'API Gateway)
- Format : JSON, OpenAPI 3.0
- Timeout : 5s maximum par appel inter-service

### Kafka (asynchrone)
- Utilisé pour : événements métier, notifications, audit
- Topics nommés : `{service}.{entity}.{action}` (ex: `user.account.created`)
- Dead Letter Queue (DLQ) activée sur chaque topic
- Chiffrement des messages en transit

---

## Isolation multi-tenant

```sql
-- Chaque table métier inclut :
tenant_id UUID NOT NULL REFERENCES tenants(id)

-- RLS activé sur chaque table :
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON users
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

---

## Sécurité réseau (Zero Trust)

| Couche | Contrôle |
|--------|----------|
| Entrée | WAF + DDoS protection |
| Transport | TLS 1.3 minimum |
| Service-to-service | Istio mTLS obligatoire |
| K8s | NetworkPolicy deny-all par défaut |
| BDD | Accessible uniquement depuis le service owning |
| Admin | VPN + bastion host uniquement |

---

## Infrastructure

```
EKS (Kubernetes)
├── Namespace: production
│   ├── api-gateway (2 replicas min)
│   ├── auth-service (2 replicas min)
│   ├── user-service (2 replicas min)
│   ├── tenant-service (2 replicas min)
│   ├── billing-service (2 replicas min)
│   └── notification-service (2 replicas min)
├── Namespace: monitoring
│   ├── Datadog Agent
│   └── OpenTelemetry Collector
└── Namespace: infra
    ├── Vault Agent
    ├── Istio Control Plane
    └── ArgoCD
```

---

## Conventions de nommage

| Élément | Convention | Exemple |
|---------|-----------|---------|
| Services | kebab-case | `user-service` |
| Topics Kafka | dot.notation | `user.account.created` |
| Variables env | SCREAMING_SNAKE | `DATABASE_URL` |
| Endpoints API | kebab-case | `/api/v1/user-profiles` |
| Tables DB | snake_case | `user_profiles` |
| Entités NestJS | PascalCase | `UserProfile` |
