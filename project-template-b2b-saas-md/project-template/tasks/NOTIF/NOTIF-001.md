# 📌 NOTIF-001 — Envoyer l'email d'invitation utilisateur

**Module** : notification-service
**Agent assigné** : Backend Agent
**Priorité** : 🟠 High
**Statut** : [ ] À faire
**Dépend de** : USER-001 (événement `user.account.created`)

---

## Contexte

Le notification-service est un **consumer Kafka pur**. Il n'expose pas d'API REST publique. Il réagit aux événements des autres services et envoie les notifications appropriées.

**Context Pack à charger** :
- `docs/vision.md`
- `docs/architecture.md` (section Kafka)
- `docs/business-rules.md` (BR-006)
- `docs/coding-standards.md`
- Ce fichier `task.md`

---

## Événements consommés

```
Topic: user.account.created
Payload:
{
  "userId":    "uuid",
  "tenantId":  "uuid",
  "email":     "alice@company.com",
  "firstName": "Alice",
  "role":      "MEMBER",
  "inviteToken": "uuid",
  "timestamp": "ISO 8601"
}

Action: Envoyer email d'invitation avec lien de setup mot de passe
Lien : https://app.platform.com/invite?token={inviteToken}
Expiration du lien : 48 heures
```

```
Topic: auth.account.locked
Payload: { userId, tenantId, email, lockedUntil }
Action: Envoyer email d'alerte au propriétaire du compte
```

```
Topic: tenant.created
Payload: { tenantId, adminEmail, name }
Action: Envoyer email de bienvenue au TENANT_ADMIN
```

---

## Checklist d'implémentation

### 📖 Analyse
- [ ] Lire la section Kafka dans architecture.md
- [ ] Comprendre le format de l'inviteToken (USER-001)

### ⚙️ Backend
- [ ] Consumer Kafka : `user.account.created` → `sendInvitationEmail()`
- [ ] Consumer Kafka : `auth.account.locked` → `sendAccountLockedEmail()`
- [ ] Consumer Kafka : `tenant.created` → `sendWelcomeEmail()`
- [ ] Templates email HTML (responsive, multi-langue ready)
- [ ] `NotificationService` : logique d'envoi via AWS SES
- [ ] Dead Letter Queue : si envoi échoue 3 fois → DLQ + alerte SIEM

### 🗄️ Base de données
- [ ] Entity `NotificationLog` : id, userId, tenantId, type, status, sentAt, error
- [ ] Éviter les doublons : vérifier si la notification a déjà été envoyée

### 📋 Audit Log
- [ ] `notification.sent` avec userId, type, status
- [ ] `notification.failed` avec userId, type, error, tentative numéro

### 🧪 Tests
- [ ] Consumer reçoit l'événement et envoie l'email (mock AWS SES)
- [ ] Template email contient le bon inviteToken
- [ ] Lien d'invitation correct avec token
- [ ] Email non envoyé deux fois pour le même événement (idempotence)
- [ ] Échec SES → retry 3x → DLQ
- [ ] Log de notification créé en DB

### ✅ Critères d'acceptation
- [ ] Email envoyé dans les 30 secondes après l'événement Kafka
- [ ] Lien d'invitation valide 48h
- [ ] Idempotence : pas de doublon si l'événement est rejoué
- [ ] Log de chaque envoi (succès et échec)
