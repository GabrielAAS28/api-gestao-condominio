## O que muda

<!-- Descreva objetivamente o que este PR faz. -->

## Por que

<!-- Contexto/problema que motivou a mudanca. Link para a issue, se houver. -->

## Como testar

1.
2.

## Checklist

- [ ] `npm run lint:ci` passa localmente
- [ ] `npm run typecheck` passa localmente
- [ ] `npm test` passa localmente
- [ ] Alteracoes no `schema.prisma` vieram acompanhadas de migration (`npx prisma migrate dev --name <descricao>`)
- [ ] Novas variaveis de ambiente foram adicionadas ao `.env.example` **e** ao painel do Railway
- [ ] Endpoints novos tem guard de autenticacao ou `@Public()` explicito
- [ ] DTOs novos tem decorators do `class-validator` em todos os campos

## Impacto no deploy

- [ ] Nao requer acao manual
- [ ] Requer nova variavel de ambiente no Railway
- [ ] Requer provisionar servico novo (banco, volume, etc.)
- [ ] Contem migration destrutiva (descreva o plano de rollback)
