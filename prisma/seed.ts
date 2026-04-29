import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Rodando seed...');

  const senhaPadrao = await bcrypt.hash('admin123', 10);

  const admin = await prisma.pessoa.upsert({
    where: { pesEmail: 'admin@condigtal.com' },
    update: {},
    create: {
      pesNome: 'Administrador Global',
      pesCpfCnpj: '00000000000',
      pesEmail: 'admin@condigtal.com',
      pesTipo: 'F',
      pesSenhaLogin: senhaPadrao,
      pesIsGlobalAdmin: true,
      pesAtivo: true,
    },
  });

  const jackson = await prisma.pessoa.upsert({
    where: { pesEmail: 'jacksonnascimento84@hotmail.com' },
    update: {},
    create: {
      pesNome: 'Jackson',
      pesCpfCnpj: '12345678901',
      pesEmail: 'jacksonnascimento84@hotmail.com',
      pesTipo: 'F',
      pesSenhaLogin: senhaPadrao,
      pesIsGlobalAdmin: true,
      pesAtivo: true,
    },
  });

  const condominio = await prisma.condominio.upsert({
    where: { conCod: 1 },
    update: {},
    create: {
      conNome: 'Condomínio Exemplo',
      conLogradouro: 'Rua das Flores',
      conNumero: '100',
      conBairro: 'Centro',
      conCidade: 'São Paulo',
      conEstado: 'SP',
      conCep: '01000000',
      conNumeroUnidades: 20,
      conTipologia: 'RESIDENCIAL',
      conDtVencimentoTaxa: 10,
      conAtivo: true,
    },
  });

  console.log('✅ Seed concluído:');
  console.log('   Admin global:  admin@condigtal.com / admin123');
  console.log('   Usuário teste: jacksonnascimento84@hotmail.com / admin123');
  console.log('   Condomínio:    #' + condominio.conCod + ' - ' + condominio.conNome);
  console.log('   IDs:', { admin: admin.pesCod, jackson: jackson.pesCod });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
