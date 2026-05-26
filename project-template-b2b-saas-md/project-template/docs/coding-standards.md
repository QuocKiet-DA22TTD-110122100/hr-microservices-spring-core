# 📐 Coding Standards
> Standards à respecter par tous les agents. Non-négociable.

---

## TypeScript

```typescript
// ✅ Types stricts — jamais de "any"
interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId: string; // UUID
}

// ✅ Enum typé
enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN',
  MANAGER = 'MANAGER',
  MEMBER = 'MEMBER',
}

// ✅ Result type pour les erreurs
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };
```

---

## NestJS — Structure par service

```
user-service/
├── src/
│   ├── user/
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   └── update-user.dto.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   ├── repositories/
│   │   │   ├── user.repository.interface.ts
│   │   │   └── user.repository.ts
│   │   ├── user.service.ts
│   │   ├── user.controller.ts
│   │   └── user.module.ts
│   ├── common/
│   │   ├── audit/
│   │   │   └── audit-log.service.ts
│   │   ├── guards/
│   │   │   └── tenant.guard.ts
│   │   └── filters/
│   │       └── http-exception.filter.ts
│   └── main.ts
├── test/
│   ├── unit/
│   └── integration/
└── migrations/
```

---

## DTO — Validation obligatoire

```typescript
// ✅ Toujours valider avec class-validator
import { IsEmail, IsEnum, IsUUID, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'john@company.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John' })
  @MinLength(2)
  firstName: string;

  @IsEnum(UserRole)
  role: UserRole;
}
```

---

## Gestion d'erreurs

```typescript
// ✅ Toujours des exceptions typées
import { ConflictException, NotFoundException } from '@nestjs/common';

async createUser(dto: CreateUserDto, tenantId: string): Promise<User> {
  const existing = await this.userRepo.findByEmail(dto.email, tenantId);
  if (existing) {
    throw new ConflictException(`Email already exists in tenant`);
  }
  // ...
}
```

---

## Logging structuré

```typescript
// ✅ OpenTelemetry — pas de console.log()
import { Logger } from '@nestjs/common';

private readonly logger = new Logger(UserService.name);

this.logger.log('User created', {
  userId: user.id,
  tenantId: user.tenantId,
  action: 'user.created',
  // ⚠️ Jamais de données sensibles (email, password, token) dans les logs
});
```

---

## Tests — Exigences minimales

| Type | Coverage minimum | Outil |
|------|-----------------|-------|
| Unit tests | 80% | Jest |
| Integration tests | Endpoints critiques | Supertest |
| E2E tests | Parcours utilisateur clés | Playwright |
| Security tests | OWASP Top 10 | OWASP ZAP |

---

## Sécurité dans le code

```typescript
// ✅ Toujours vérifier le tenant dans les guards
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceTenantId = request.params.tenantId;

    // CRITIQUE : vérifier que l'utilisateur appartient au tenant
    if (user.tenantId !== resourceTenantId) {
      throw new ForbiddenException('Cross-tenant access denied');
    }
    return true;
  }
}
```
