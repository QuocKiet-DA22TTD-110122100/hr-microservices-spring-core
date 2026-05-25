# 🔐 Contrôles ISO 27001 — Mapping Technique

## A.9 — Contrôle d'accès
| Contrôle | Implémentation technique |
|----------|--------------------------|
| A.9.1 Politique d'accès | RBAC défini dans `business-rules.md` (tableau permissions) |
| A.9.2 Gestion des accès | Provisioning SCIM 2.0, déprovision automatique |
| A.9.3 Responsabilités utilisateur | MFA obligatoire admins (BR-003) |
| A.9.4 Contrôle accès système | JWT RS256 + TenantGuard sur chaque endpoint |

## A.10 — Cryptographie
| Contrôle | Implémentation technique |
|----------|--------------------------|
| A.10.1 Politique crypto | TLS 1.3 in-transit, AES-256 at-rest |
| A.10.1 Gestion des clés | HashiCorp Vault, rotation 90j (DEC-005) |

## A.12 — Sécurité opérationnelle
| Contrôle | Implémentation technique |
|----------|--------------------------|
| A.12.3 Backup | RDS backup 35j, S3 versioning |
| A.12.4 Logging | OpenTelemetry + Datadog WORM, rétention 1 an (BR-007) |
| A.12.6 Gestion vulnérabilités | Snyk + Trivy dans CI/CD (DEC-008) |

## A.13 — Sécurité des communications
| Contrôle | Implémentation technique |
|----------|--------------------------|
| A.13.1 Réseaux | NetworkPolicy K8s deny-all, Istio mTLS (DEC-006) |
| A.13.2 Transfert info | Kafka chiffré, TLS 1.3 sur tous les endpoints |

## A.14 — Développement sécurisé
| Contrôle | Implémentation technique |
|----------|--------------------------|
| A.14.2 Sécurité dev | SAST (SonarQube) bloquant dans CI/CD (DEC-008) |
| A.14.2 Revue code | PR obligatoire, minimum 1 reviewer |
| A.14.3 Test sécurité | DAST + pentest annuel |

---

## Checklist audit annuel
- [ ] Revue des accès utilisateurs (tous les 90j)
- [ ] Rotation des clés Vault vérifiée
- [ ] Rapport pentest < 1 an
- [ ] Logs d'audit disponibles et intègres
- [ ] Formation sécurité équipe (annuelle)
- [ ] Business Continuity Plan testé
- [ ] Rapport SOC 2 Type II à jour
