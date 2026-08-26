-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SINDICO', 'MORADOR', 'FUNCIONARIO_ADM', 'PORTEIRO', 'ADMIN');

-- CreateEnum
CREATE TYPE "PessoaTipo" AS ENUM ('F', 'J');

-- CreateEnum
CREATE TYPE "CondominioTipologia" AS ENUM ('RESIDENCIAL', 'COMERCIAL', 'MISTO');

-- CreateEnum
CREATE TYPE "UnidadeStatusOcupacao" AS ENUM ('OCUPADA', 'VAZIA', 'EM_REFORMA', 'MULTIPROPRIEDADE');

-- CreateEnum
CREATE TYPE "UnidadeTipo" AS ENUM ('APARTAMENTO', 'COMERCIAL', 'GARAGEM', 'DEPOSITO', 'OUTROS');

-- CreateEnum
CREATE TYPE "OcupanteVinculo" AS ENUM ('PROPRIETARIO', 'LOCATARIO', 'PROMITENTE_COMPRADOR', 'CESSIONARIO', 'MULTIPROPRIETARIO', 'CONJUGE', 'DEPENDENTE');

-- CreateEnum
CREATE TYPE "TipoPeriodoOcupante" AS ENUM ('FIXO', 'FLUTUANTE', 'MISTO');

-- CreateEnum
CREATE TYPE "OcorrenciaStatus" AS ENUM ('ABERTA', 'EM_ANALISE', 'RESOLVIDA');

-- CreateEnum
CREATE TYPE "OcorrenciaTipo" AS ENUM ('BARULHO', 'CONFLITO', 'MANUTENCAO', 'RECLAMACAO', 'OUTRO');

-- CreateEnum
CREATE TYPE "EncomendaStatus" AS ENUM ('PENDENTE', 'RETIRADA', 'DEVOLVIDA', 'EXTRAVIADA');

-- CreateEnum
CREATE TYPE "EncomendaTipo" AS ENUM ('CORREIOS', 'TRANSPORTADORA', 'DELIVERY', 'OUTROS');

-- CreateEnum
CREATE TYPE "ReservaStatus" AS ENUM ('PENDENTE_APROVACAO', 'APROVADA', 'REJEITADA', 'CANCELADA_PELO_MORADOR', 'CONCLUIDA');

-- CreateEnum
CREATE TYPE "VisitanteStatus" AS ENUM ('NO_LOCAL', 'SAIU');

-- CreateEnum
CREATE TYPE "PublicoDestino" AS ENUM ('TODOS', 'PROPRIETARIOS', 'INQUILINOS', 'FUNCIONARIOS');

-- CreateEnum
CREATE TYPE "ContratoStatus" AS ENUM ('ATIVO', 'A_VENCER', 'FINALIZADO', 'RESCINDIDO');

-- CreateTable
CREATE TABLE "gc_pessoa" (
    "pes_cod" SERIAL NOT NULL,
    "pes_nome" VARCHAR(100) NOT NULL,
    "pes_cpf_cnpj" VARCHAR(14) NOT NULL,
    "pes_tipo" "PessoaTipo" NOT NULL DEFAULT 'F',
    "pes_email" VARCHAR(100) NOT NULL,
    "pes_telefone" VARCHAR(20),
    "pes_telefone2" VARCHAR(20),
    "pes_ativo" BOOLEAN NOT NULL DEFAULT true,
    "pes_dt_cadastro" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pes_dt_atualizacao" TIMESTAMP(6),
    "pes_senha_login" VARCHAR(255),
    "pes_is_global_admin" BOOLEAN NOT NULL DEFAULT false,
    "pes_imagem" BYTEA,

    CONSTRAINT "gc_pessoa_pkey" PRIMARY KEY ("pes_cod")
);

-- CreateTable
CREATE TABLE "gc_refresh_token" (
    "id" TEXT NOT NULL,
    "pes_cod" INTEGER NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "revoked_at" TIMESTAMP(6),
    "user_agent" VARCHAR(255),
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gc_refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gc_condominio" (
    "con_cod" SERIAL NOT NULL,
    "con_nome" VARCHAR(100) NOT NULL,
    "con_logradouro" VARCHAR(100),
    "con_numero" VARCHAR(10),
    "con_complemento" VARCHAR(50),
    "con_bairro" VARCHAR(50),
    "con_cidade" VARCHAR(50),
    "con_estado" VARCHAR(2),
    "con_cep" VARCHAR(8),
    "con_pais" VARCHAR(50) DEFAULT 'Brasil',
    "con_referencia" VARCHAR(100),
    "con_numero_unidades" INTEGER,
    "con_tipologia" "CondominioTipologia" NOT NULL,
    "con_dt_vencimento_taxa" INTEGER,
    "con_dt_cadastro" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "con_dt_atualizacao" TIMESTAMP(6),
    "con_ativo" BOOLEAN NOT NULL DEFAULT true,
    "con_geracao_auto_ativa" BOOLEAN NOT NULL DEFAULT false,
    "con_dia_geracao_cobranca" INTEGER,

    CONSTRAINT "gc_condominio_pkey" PRIMARY KEY ("con_cod")
);

-- CreateTable
CREATE TABLE "gc_unidade" (
    "uni_cod" SERIAL NOT NULL,
    "con_cod" INTEGER NOT NULL,
    "uni_numero" VARCHAR(10) NOT NULL,
    "uni_bloco" VARCHAR(50),
    "uni_andar" VARCHAR(50),
    "uni_status_ocupacao" "UnidadeStatusOcupacao",
    "uni_fracao_ideal" DECIMAL(5,2),
    "uni_area_privada" DECIMAL(10,2),
    "uni_observacao" TEXT,
    "uni_tipo" "UnidadeTipo",
    "uni_dt_cadastro" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uni_dt_atualizacao" TIMESTAMP(6),
    "uni_ativa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "gc_unidade_pkey" PRIMARY KEY ("uni_cod")
);

-- CreateTable
CREATE TABLE "gc_ocupante" (
    "ocu_cod" SERIAL NOT NULL,
    "pes_cod" INTEGER NOT NULL,
    "uni_cod" INTEGER NOT NULL,
    "ocu_vinculo" "OcupanteVinculo" NOT NULL,
    "ocu_dt_inicio_ocupacao" DATE,
    "ocu_dt_fim_ocupacao" DATE,
    "ocu_periodo_uso" VARCHAR(100),
    "ocu_tipo_periodo" "TipoPeriodoOcupante",
    "ocu_dt_cadastro" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ocu_dt_atualizacao" TIMESTAMP(6),

    CONSTRAINT "gc_ocupante_pkey" PRIMARY KEY ("ocu_cod")
);

-- CreateTable
CREATE TABLE "gc_usuario_condominio" (
    "pes_cod" INTEGER NOT NULL,
    "con_cod" INTEGER NOT NULL,
    "usc_papel" "UserRole" NOT NULL,
    "usc_dt_associacao" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usc_ativo_associacao" BOOLEAN NOT NULL DEFAULT true,
    "usc_dt_atualizacao" TIMESTAMP(6),

    CONSTRAINT "gc_usuario_condominio_pkey" PRIMARY KEY ("pes_cod","con_cod","usc_papel")
);

-- CreateTable
CREATE TABLE "gc_contrato" (
    "ctr_cod" SERIAL NOT NULL,
    "con_cod" INTEGER NOT NULL,
    "ctr_empresa" VARCHAR(100) NOT NULL,
    "ctr_servico" VARCHAR(255) NOT NULL,
    "ctr_valor" DECIMAL(10,2) NOT NULL,
    "ctr_responsavel" VARCHAR(100),
    "ctr_status" "ContratoStatus" NOT NULL,
    "ctr_data_inicio" DATE NOT NULL,
    "ctr_data_fim" DATE NOT NULL,
    "ctr_observacoes" TEXT,
    "ctr_dt_cadastro" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ctr_dt_atualizacao" TIMESTAMP(6),

    CONSTRAINT "gc_contrato_pkey" PRIMARY KEY ("ctr_cod")
);

-- CreateTable
CREATE TABLE "gc_ocorrencia" (
    "oco_cod" SERIAL NOT NULL,
    "con_cod" INTEGER NOT NULL,
    "uni_cod" INTEGER NOT NULL,
    "pes_cod_registro" INTEGER NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo" "OcorrenciaTipo" NOT NULL,
    "status" "OcorrenciaStatus" NOT NULL DEFAULT 'ABERTA',
    "data_registro" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(6),
    "parecer_final" TEXT,
    "pes_cod_finalizou" INTEGER,
    "data_finalizacao" TIMESTAMP(6),

    CONSTRAINT "gc_ocorrencia_pkey" PRIMARY KEY ("oco_cod")
);

-- CreateTable
CREATE TABLE "gc_ocorrencia_comentario" (
    "occ_cod" SERIAL NOT NULL,
    "oco_cod" INTEGER NOT NULL,
    "pes_cod_comentario" INTEGER NOT NULL,
    "comentario" TEXT NOT NULL,
    "data_comentario" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gc_ocorrencia_comentario_pkey" PRIMARY KEY ("occ_cod")
);

-- CreateTable
CREATE TABLE "gc_ocorrencia_anexo" (
    "oca_cod" SERIAL NOT NULL,
    "oco_cod" INTEGER NOT NULL,
    "pes_cod_anexo" INTEGER NOT NULL,
    "caminho_arquivo" VARCHAR(555) NOT NULL,
    "nome_original" VARCHAR(255),
    "tipo_arquivo" VARCHAR(100),
    "tamanho_arquivo" BIGINT,
    "data_anexo" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gc_ocorrencia_anexo_pkey" PRIMARY KEY ("oca_cod")
);

-- CreateTable
CREATE TABLE "gc_comunicado" (
    "com_cod" SERIAL NOT NULL,
    "com_titulo" VARCHAR(255) NOT NULL,
    "com_mensagem" TEXT NOT NULL,
    "com_publico_destino" "PublicoDestino" NOT NULL,
    "com_is_urgente" BOOLEAN NOT NULL DEFAULT false,
    "com_caminho_anexo" VARCHAR(555),
    "com_dt_cadastro" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pes_cod_criador" INTEGER NOT NULL,

    CONSTRAINT "gc_comunicado_pkey" PRIMARY KEY ("com_cod")
);

-- CreateTable
CREATE TABLE "gc_comunicado_leitura" (
    "com_cod" INTEGER NOT NULL,
    "pes_cod" INTEGER NOT NULL,
    "cle_dt_leitura" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gc_comunicado_leitura_pkey" PRIMARY KEY ("com_cod","pes_cod")
);

-- CreateTable
CREATE TABLE "gc_encomenda" (
    "enc_cod" BIGSERIAL NOT NULL,
    "con_cod" INTEGER NOT NULL,
    "uni_cod" INTEGER NOT NULL,
    "pes_cod_registro" INTEGER NOT NULL,
    "destinatario" VARCHAR(100) NOT NULL,
    "nome_recebido_por" VARCHAR(100) NOT NULL,
    "descricao" VARCHAR(255),
    "tipo" "EncomendaTipo" NOT NULL,
    "status" "EncomendaStatus" NOT NULL DEFAULT 'PENDENTE',
    "data_recebimento" TIMESTAMP(6) NOT NULL,
    "observacoes" TEXT,
    "nome_retirada" VARCHAR(100),
    "pes_cod_retirada" INTEGER,
    "data_retirada" TIMESTAMP(6),
    "observacao_atualizacao" TEXT,
    "data_atualizacao_status" TIMESTAMP(6),

    CONSTRAINT "gc_encomenda_pkey" PRIMARY KEY ("enc_cod")
);

-- CreateTable
CREATE TABLE "gc_visitante" (
    "vis_cod" SERIAL NOT NULL,
    "con_cod" INTEGER NOT NULL,
    "uni_cod" INTEGER NOT NULL,
    "pes_cod_morador" INTEGER,
    "pes_cod_registro" INTEGER NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "cpf" VARCHAR(14),
    "rg" VARCHAR(20),
    "telefone" VARCHAR(20),
    "status" "VisitanteStatus" NOT NULL DEFAULT 'NO_LOCAL',
    "data_entrada" TIMESTAMP(6) NOT NULL,
    "data_saida" TIMESTAMP(6),
    "observacoes" TEXT,
    "data_cadastro" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(6),

    CONSTRAINT "gc_visitante_pkey" PRIMARY KEY ("vis_cod")
);

-- CreateTable
CREATE TABLE "gc_area_comum" (
    "are_cod" SERIAL NOT NULL,
    "con_cod" INTEGER NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "descricao" TEXT,
    "termos_uso" TEXT,
    "capacidade_maxima" INTEGER,
    "permite_convidados" BOOLEAN NOT NULL DEFAULT false,
    "limite_convidados" INTEGER,
    "dias_antecedencia_min" INTEGER NOT NULL DEFAULT 1,
    "dias_antecedencia_max" INTEGER NOT NULL DEFAULT 30,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "taxa_valor" DECIMAL(10,2),
    "data_cadastro" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(6),

    CONSTRAINT "gc_area_comum_pkey" PRIMARY KEY ("are_cod")
);

-- CreateTable
CREATE TABLE "gc_area_comum_turno" (
    "tur_cod" SERIAL NOT NULL,
    "are_cod" INTEGER NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "hora_inicio" TIME(6) NOT NULL,
    "hora_fim" TIME(6) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "gc_area_comum_turno_pkey" PRIMARY KEY ("tur_cod")
);

-- CreateTable
CREATE TABLE "gc_reserva" (
    "res_cod" SERIAL NOT NULL,
    "are_cod" INTEGER NOT NULL,
    "tur_cod" INTEGER,
    "uni_cod" INTEGER NOT NULL,
    "pes_cod_morador" INTEGER NOT NULL,
    "pes_cod_aprovador" INTEGER,
    "data" DATE NOT NULL,
    "status" "ReservaStatus" NOT NULL DEFAULT 'PENDENTE_APROVACAO',
    "termos_aceitos" BOOLEAN NOT NULL DEFAULT false,
    "motivo_rejeicao" TEXT,
    "data_registro" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(6),

    CONSTRAINT "gc_reserva_pkey" PRIMARY KEY ("res_cod")
);

-- CreateTable
CREATE TABLE "gc_reserva_convidado" (
    "rcv_cod" SERIAL NOT NULL,
    "res_cod" INTEGER NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "documento" VARCHAR(50),

    CONSTRAINT "gc_reserva_convidado_pkey" PRIMARY KEY ("rcv_cod")
);

-- CreateTable
CREATE TABLE "gc_password_reset_token" (
    "token" VARCHAR(128) NOT NULL,
    "pes_cod" INTEGER NOT NULL,
    "expiracao" TIMESTAMP(6) NOT NULL,
    "used_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gc_password_reset_token_pkey" PRIMARY KEY ("token")
);

-- CreateTable
CREATE TABLE "_ComunicadoCondominio" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "gc_pessoa_pes_cpf_cnpj_key" ON "gc_pessoa"("pes_cpf_cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "gc_pessoa_pes_email_key" ON "gc_pessoa"("pes_email");

-- CreateIndex
CREATE INDEX "gc_pessoa_pes_email_idx" ON "gc_pessoa"("pes_email");

-- CreateIndex
CREATE UNIQUE INDEX "gc_refresh_token_token_hash_key" ON "gc_refresh_token"("token_hash");

-- CreateIndex
CREATE INDEX "gc_refresh_token_pes_cod_idx" ON "gc_refresh_token"("pes_cod");

-- CreateIndex
CREATE INDEX "gc_refresh_token_expires_at_idx" ON "gc_refresh_token"("expires_at");

-- CreateIndex
CREATE INDEX "gc_unidade_con_cod_idx" ON "gc_unidade"("con_cod");

-- CreateIndex
CREATE INDEX "gc_ocupante_uni_cod_idx" ON "gc_ocupante"("uni_cod");

-- CreateIndex
CREATE UNIQUE INDEX "gc_ocupante_pes_cod_uni_cod_key" ON "gc_ocupante"("pes_cod", "uni_cod");

-- CreateIndex
CREATE INDEX "gc_usuario_condominio_con_cod_idx" ON "gc_usuario_condominio"("con_cod");

-- CreateIndex
CREATE INDEX "gc_contrato_con_cod_idx" ON "gc_contrato"("con_cod");

-- CreateIndex
CREATE INDEX "gc_ocorrencia_con_cod_idx" ON "gc_ocorrencia"("con_cod");

-- CreateIndex
CREATE INDEX "gc_ocorrencia_uni_cod_idx" ON "gc_ocorrencia"("uni_cod");

-- CreateIndex
CREATE INDEX "gc_ocorrencia_status_idx" ON "gc_ocorrencia"("status");

-- CreateIndex
CREATE INDEX "gc_ocorrencia_comentario_oco_cod_idx" ON "gc_ocorrencia_comentario"("oco_cod");

-- CreateIndex
CREATE INDEX "gc_ocorrencia_anexo_oco_cod_idx" ON "gc_ocorrencia_anexo"("oco_cod");

-- CreateIndex
CREATE INDEX "gc_encomenda_con_cod_idx" ON "gc_encomenda"("con_cod");

-- CreateIndex
CREATE INDEX "gc_encomenda_uni_cod_idx" ON "gc_encomenda"("uni_cod");

-- CreateIndex
CREATE INDEX "gc_encomenda_status_idx" ON "gc_encomenda"("status");

-- CreateIndex
CREATE INDEX "gc_visitante_con_cod_idx" ON "gc_visitante"("con_cod");

-- CreateIndex
CREATE INDEX "gc_visitante_uni_cod_idx" ON "gc_visitante"("uni_cod");

-- CreateIndex
CREATE INDEX "gc_visitante_status_idx" ON "gc_visitante"("status");

-- CreateIndex
CREATE INDEX "gc_area_comum_con_cod_idx" ON "gc_area_comum"("con_cod");

-- CreateIndex
CREATE INDEX "gc_area_comum_turno_are_cod_idx" ON "gc_area_comum_turno"("are_cod");

-- CreateIndex
CREATE INDEX "gc_reserva_are_cod_idx" ON "gc_reserva"("are_cod");

-- CreateIndex
CREATE INDEX "gc_reserva_status_idx" ON "gc_reserva"("status");

-- CreateIndex
CREATE INDEX "gc_reserva_convidado_res_cod_idx" ON "gc_reserva_convidado"("res_cod");

-- CreateIndex
CREATE INDEX "gc_password_reset_token_pes_cod_idx" ON "gc_password_reset_token"("pes_cod");

-- CreateIndex
CREATE INDEX "gc_password_reset_token_expiracao_idx" ON "gc_password_reset_token"("expiracao");

-- CreateIndex
CREATE UNIQUE INDEX "_ComunicadoCondominio_AB_unique" ON "_ComunicadoCondominio"("A", "B");

-- CreateIndex
CREATE INDEX "_ComunicadoCondominio_B_index" ON "_ComunicadoCondominio"("B");

-- AddForeignKey
ALTER TABLE "gc_refresh_token" ADD CONSTRAINT "gc_refresh_token_pes_cod_fkey" FOREIGN KEY ("pes_cod") REFERENCES "gc_pessoa"("pes_cod") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gc_unidade" ADD CONSTRAINT "gc_unidade_con_cod_fkey" FOREIGN KEY ("con_cod") REFERENCES "gc_condominio"("con_cod") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gc_ocupante" ADD CONSTRAINT "gc_ocupante_pes_cod_fkey" FOREIGN KEY ("pes_cod") REFERENCES "gc_pessoa"("pes_cod") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gc_ocupante" ADD CONSTRAINT "gc_ocupante_uni_cod_fkey" FOREIGN KEY ("uni_cod") REFERENCES "gc_unidade"("uni_cod") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gc_usuario_condominio" ADD CONSTRAINT "gc_usuario_condominio_pes_cod_fkey" FOREIGN KEY ("pes_cod") REFERENCES "gc_pessoa"("pes_cod") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gc_usuario_condominio" ADD CONSTRAINT "gc_usuario_condominio_con_cod_fkey" FOREIGN KEY ("con_cod") REFERENCES "gc_condominio"("con_cod") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gc_contrato" ADD CONSTRAINT "gc_contrato_con_cod_fkey" FOREIGN KEY ("con_cod") REFERENCES "gc_condominio"("con_cod") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gc_ocorrencia" ADD CONSTRAINT "gc_ocorrencia_con_cod_fkey" FOREIGN KEY ("con_cod") REFERENCES "gc_condominio"("con_cod") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gc_ocorrencia" ADD CONSTRAINT "gc_ocorrencia_uni_cod_fkey" FOREIGN KEY ("uni_cod") REFERENCES "gc_unidade"("uni_cod") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gc_ocorrencia" ADD CONSTRAINT "gc_ocorrencia_pes_cod_registro_fkey" FOREIGN KEY ("pes_cod_registro") REFERENCES "gc_pessoa"("pes_cod") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gc_ocorrencia" ADD CONSTRAINT "gc_ocorrencia_pes_cod_finalizou_fkey" FOREIGN KEY ("pes_cod_finalizou") REFERENCES "gc_pessoa"("pes_cod") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gc_ocorrencia_comentario" ADD CONSTRAINT "gc_ocorrencia_comentario_oco_cod_fkey" FOREIGN KEY ("oco_cod") REFERENCES "gc_ocorrencia"("oco_cod") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gc_ocorrencia_comentario" ADD CONSTRAINT "gc_ocorrencia_comentario_pes_cod_comentario_fkey" FOREIGN KEY ("pes_cod_comentario") REFERENCES "gc_pessoa"("pes_cod") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gc_ocorrencia_anexo" ADD CONSTRAINT "gc_ocorrencia_anexo_oco_cod_fkey" FOREIGN KEY ("oco_cod") REFERENCES "gc_ocorrencia"("oco_cod") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gc_ocorrencia_anexo" ADD CONSTRAINT "gc_ocorrencia_anexo_pes_cod_anexo_fkey" FOREIGN KEY ("pes_cod_anexo") REFERENCES "gc_pessoa"("pes_cod") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gc_comunicado" ADD CONSTRAINT "gc_comunicado_pes_cod_criador_fkey" FOREIGN KEY ("pes_cod_criador") REFERENCES "gc_pessoa"("pes_cod") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gc_comunicado_leitura" ADD CONSTRAINT "gc_comunicado_leitura_com_cod_fkey" FOREIGN KEY ("com_cod") REFERENCES "gc_comunicado"("com_cod") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gc_comunicado_leitura" ADD CONSTRAINT "gc_comunicado_leitura_pes_cod_fkey" FOREIGN KEY ("pes_cod") REFERENCES "gc_pessoa"("pes_cod") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gc_encomenda" ADD CONSTRAINT "gc_encomenda_con_cod_fkey" FOREIGN KEY ("con_cod") REFERENCES "gc_condominio"("con_cod") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gc_encomenda" ADD CONSTRAINT "gc_encomenda_uni_cod_fkey" FOREIGN KEY ("uni_cod") REFERENCES "gc_unidade"("uni_cod") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gc_encomenda" ADD CONSTRAINT "gc_encomenda_pes_cod_registro_fkey" FOREIGN KEY ("pes_cod_registro") REFERENCES "gc_pessoa"("pes_cod") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gc_encomenda" ADD CONSTRAINT "gc_encomenda_pes_cod_retirada_fkey" FOREIGN KEY ("pes_cod_retirada") REFERENCES "gc_pessoa"("pes_cod") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gc_visitante" ADD CONSTRAINT "gc_visitante_con_cod_fkey" FOREIGN KEY ("con_cod") REFERENCES "gc_condominio"("con_cod") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gc_visitante" ADD CONSTRAINT "gc_visitante_uni_cod_fkey" FOREIGN KEY ("uni_cod") REFERENCES "gc_unidade"("uni_cod") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gc_visitante" ADD CONSTRAINT "gc_visitante_pes_cod_morador_fkey" FOREIGN KEY ("pes_cod_morador") REFERENCES "gc_pessoa"("pes_cod") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gc_visitante" ADD CONSTRAINT "gc_visitante_pes_cod_registro_fkey" FOREIGN KEY ("pes_cod_registro") REFERENCES "gc_pessoa"("pes_cod") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gc_area_comum" ADD CONSTRAINT "gc_area_comum_con_cod_fkey" FOREIGN KEY ("con_cod") REFERENCES "gc_condominio"("con_cod") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gc_area_comum_turno" ADD CONSTRAINT "gc_area_comum_turno_are_cod_fkey" FOREIGN KEY ("are_cod") REFERENCES "gc_area_comum"("are_cod") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gc_reserva" ADD CONSTRAINT "gc_reserva_are_cod_fkey" FOREIGN KEY ("are_cod") REFERENCES "gc_area_comum"("are_cod") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gc_reserva" ADD CONSTRAINT "gc_reserva_tur_cod_fkey" FOREIGN KEY ("tur_cod") REFERENCES "gc_area_comum_turno"("tur_cod") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gc_reserva" ADD CONSTRAINT "gc_reserva_uni_cod_fkey" FOREIGN KEY ("uni_cod") REFERENCES "gc_unidade"("uni_cod") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gc_reserva" ADD CONSTRAINT "gc_reserva_pes_cod_morador_fkey" FOREIGN KEY ("pes_cod_morador") REFERENCES "gc_pessoa"("pes_cod") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gc_reserva" ADD CONSTRAINT "gc_reserva_pes_cod_aprovador_fkey" FOREIGN KEY ("pes_cod_aprovador") REFERENCES "gc_pessoa"("pes_cod") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gc_reserva_convidado" ADD CONSTRAINT "gc_reserva_convidado_res_cod_fkey" FOREIGN KEY ("res_cod") REFERENCES "gc_reserva"("res_cod") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gc_password_reset_token" ADD CONSTRAINT "gc_password_reset_token_pes_cod_fkey" FOREIGN KEY ("pes_cod") REFERENCES "gc_pessoa"("pes_cod") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ComunicadoCondominio" ADD CONSTRAINT "_ComunicadoCondominio_A_fkey" FOREIGN KEY ("A") REFERENCES "gc_comunicado"("com_cod") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ComunicadoCondominio" ADD CONSTRAINT "_ComunicadoCondominio_B_fkey" FOREIGN KEY ("B") REFERENCES "gc_condominio"("con_cod") ON DELETE CASCADE ON UPDATE CASCADE;

