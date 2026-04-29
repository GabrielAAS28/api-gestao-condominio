import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Marca um handler como acessível apenas para determinados papéis.
 *
 * - Passar nenhum valor + usar @GlobalAdminOnly() para restringir a admin global
 * - Passar UserRole[] para permitir usuários com QUALQUER um desses papéis em
 *   QUALQUER condomínio.
 *
 * Para lógica mais fina (ex: "usuário precisa ser SINDICO DESTE condomínio
 * específico na rota"), use o helper `userHasRoleInCondominio` dentro do
 * service — isso requer conhecer o conCod da requisição.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export const GLOBAL_ADMIN_KEY = 'globalAdminOnly';
export const GlobalAdminOnly = () => SetMetadata(GLOBAL_ADMIN_KEY, true);
