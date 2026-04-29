import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedUser {
  pesCod: number;
  email: string;
  nome: string;
  isGlobalAdmin: boolean;
  roles: string[]; // ex: ['ROLE_SINDICO_1', 'ROLE_MORADOR_2']
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
