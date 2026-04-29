import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { GLOBAL_ADMIN_KEY, ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const globalAdminOnly = this.reflector.getAllAndOverride<boolean>(
      GLOBAL_ADMIN_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Sem restrição de role → libera
    if (!globalAdminOnly && (!requiredRoles || requiredRoles.length === 0)) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('Usuário não autenticado');

    if (globalAdminOnly && !user.isGlobalAdmin) {
      throw new ForbiddenException('Acesso restrito a administrador global');
    }

    if (requiredRoles && requiredRoles.length > 0) {
      if (user.isGlobalAdmin) return true;
      const userRoles: string[] = user.roles ?? [];
      const hasAny = requiredRoles.some((r) =>
        userRoles.some((ur) => ur.startsWith(`ROLE_${r}`)),
      );
      if (!hasAny) {
        throw new ForbiddenException(
          `Acesso restrito a: ${requiredRoles.join(', ')}`,
        );
      }
    }

    return true;
  }
}
