# 📦 Context Pack — Auth Service
> Envoyer UNIQUEMENT ces 5 fichiers à l'agent pour les tâches du auth-service.
> Objectif : réduire les tokens, garder le contexte pertinent.

---

## Fichiers à inclure dans le prompt de l'agent

1. **`docs/vision.md`** — Vision globale et tech stack
2. **`docs/business-rules.md`** — Règles : BR-003, BR-004, BR-005 (auth)
3. **`docs/project-memory.md`** — Décisions : DEC-001 (JWT), DEC-002 (Redis)
4. **`docs/coding-standards.md`** — Standards NestJS + TypeScript
5. **`tasks/AUTH/[TASK-ID].md`** — La tâche courante

---

## Résumé des décisions clés pour ce service

| Décision | Valeur |
|----------|--------|
| JWT algorithme | RS256 (asymétrique) |
| Access token TTL | 15 minutes |
| Refresh token TTL | 7 jours |
| Refresh token storage | Redis (clé: `rt:{userId}:{tokenId}`) |
| Révocation | Redis blacklist + événement Kafka |
| Rate limiting login | 5 tentatives / 15 min |
| MFA | Obligatoire pour ADMIN (TOTP via authenticator) |
| Clés JWT | Gérées par HashiCorp Vault, rotation 90j |

---

## Endpoints existants (ne pas recréer)
*Aucun pour l'instant — AUTH-001 est la première tâche*

---

## Schéma DB actuel (auth-service)
*Aucun — à créer dans AUTH-001*

---

## Topics Kafka produits par ce service
| Topic | Quand |
|-------|-------|
| `auth.login.success` | Connexion réussie |
| `auth.login.failed` | Tentative échouée |
| `auth.account.locked` | Compte verrouillé (BR-005) |
| `auth.logout` | Déconnexion |
| `auth.token.revoked` | Token révoqué (BR-004) |
