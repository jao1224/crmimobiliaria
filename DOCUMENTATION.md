# Documentação Completa do Projeto: LeadFlow

## 1. Introdução

Este documento fornece uma visão técnica detalhada do projeto **LeadFlow**, uma plataforma de gestão imobiliária desenvolvida no Firebase Studio. O sistema foi projetado para ser uma ferramenta completa, abrangendo desde o cadastro de imóveis e clientes até a gestão financeira e de processos complexos.

A versão atual opera em um **modo simulado**, onde todas as funcionalidades são interativas, mas os dados são pré-carregados e não persistem em um banco de dados real. Isso permite a validação completa dos fluxos de interface e da lógica de negócio antes da integração com o back-end (Firebase).

---

## 2. Estrutura do Projeto

O projeto segue a estrutura padrão do Next.js com o App Router, organizada da seguinte forma:

-   **/src/app/**: Contém as rotas principais da aplicação.
    -   **/src/app/page.tsx**: Página de Login.
    -   **/src/app/register/page.tsx**: Página de Cadastro.
    -   **/src/app/dashboard/**: Layout e páginas do painel principal, acessível após o login. Cada subpasta representa uma rota (ex: `/dashboard/properties`).
-   **/src/components/**: Contém os componentes React reutilizáveis.
    -   **/src/components/ui/**: Componentes de UI da biblioteca `shadcn/ui` (Button, Card, Table, etc.).
    -   **/src/components/auth/**: Formulários de login e registro.
    -   **/src/components/dashboard/**: Componentes específicos do painel, como `header.tsx`, `sales-report.tsx` e `property-matcher.tsx`.
-   **/src/lib/**: Arquivos de utilitários e dados simulados.
    -   **`utils.ts`**: Funções utilitárias, como `cn` para classes CSS.
    -   **`data.ts`, `crm-data.ts`**: Arquivos centrais que contêm os dados simulados (imóveis, negociações, usuários, etc.) e a lógica de negócio associada.
    -   **`actions.ts`**: Funções de servidor (Server Actions) que interagem com a lógica de IA.
-   **/src/ai/**: Lógica relacionada à Inteligência Artificial com Genkit.
    -   **`genkit.ts`**: Configuração do cliente Genkit.
    -   **`/flows/property-matching.ts`**: Fluxo de IA para combinar imóveis com os requisitos do cliente.
-   **/src/contexts/**: Contextos React para gerenciamento de estado global.
    -   **`ProfileContext.tsx`**: Gerencia o estado do perfil de usuário ativo para simular diferentes visualizações.

---

## 3. Detalhamento das Funcionalidades

### 3.1. Autenticação e Perfis de Usuário

-   **Login e Registro**: Páginas `/` e `/register` contêm formulários para entrada e criação de contas. A lógica atual é simulada, sem integração real com o Firebase Authentication.
-   **Perfis de Usuário**: O sistema simula múltiplos perfis (`Admin`, `Imobiliária`, `Corretor Autônomo`, etc.). A troca de perfis é feita através do menu de usuário no canto inferior esquerdo, utilizando o `ProfileContext` para controlar a visibilidade de rotas e funcionalidades em toda a aplicação.

### 3.2. Painel Principal (`/dashboard`)

-   **Visão Geral Dinâmica**: Apresenta quatro cards principais:
    -   **Receita Total**: Sincronizado com as negociações marcadas como "Venda Concluída".
    -   **Negócios Ativos**: Contagem em tempo real de negociações que não foram concluídas.
    -   **Imóveis Vendidos**: Contagem de negociações concluídas.
    -   **Novos Leads**: Sincronizado com a lista de leads do módulo de CRM.
-   **Relatório de Vendas**: Um gráfico de barras visualiza a receita de vendas por mês, com base nos dados simulados de negociações concluídas.

### 3.3. Módulos Detalhados

#### **📍 Imóveis (`/properties`)**

-   **Listagem**: Tabela com todos os imóveis, exibindo imagem, nome, endereço, status, preço e captador.
-   **Adicionar/Editar**: Modais para cadastrar novos imóveis ou editar existentes, incluindo upload de imagem (simulado).
-   **Detalhes**: Um modal exibe todas as informações de um imóvel, incluindo descrição e dados do proprietário.
-   **Combinador de Imóveis (IA)**: Uma funcionalidade que usa Genkit para analisar os requisitos de um cliente (texto livre) e compará-los com a lista de imóveis disponíveis, retornando as melhores correspondências.

#### **📍 CRM (`/crm`)**

-   **Abas**: Organizado em três seções:
    1.  **Leads**: Lista de potenciais clientes. Permite converter um lead em cliente.
    2.  **Negócios em Andamento**: Funil de vendas, listando propostas ativas.
    3.  **Clientes**: Base de dados de clientes convertidos.
-   **Ações**: Modais para adicionar novos leads e negócios.

#### **📍 Negociações (`/negotiations`)**

-   **Tabela Central**: Lista todas as negociações, com filtros por tipo, status do contrato e responsável.
-   **Iniciar Negociação**: Fluxo para criar uma nova negociação, buscando dados do imóvel e do cliente por seus respectivos IDs para preenchimento automático.
-   **Ações por Negociação**:
    -   **Gerar Contrato**: Redireciona para a página de contrato (`/negotiations/[id]/contract`).
    -   **Ver Processo**: Navega para a visão detalhada do processo administrativo.
    -   **Concluir Venda**: Ação que finaliza a negociação, atualiza seu status e **gera automaticamente uma comissão** no módulo Financeiro.

#### **📍 Contrato (`/negotiations/[id]/contract`)**

-   **Anexo e Editor**: Permite duas formas de gerenciar o contrato:
    1.  **Anexar Arquivo**: Upload de um arquivo PDF/Word.
    2.  **Editor de Contrato**: Um formulário detalhado que gera um contrato de compra e venda com campos pré-preenchidos (comprador, vendedor, imóvel, valores) e cláusulas editáveis.
-   **Impressão**: Funcionalidade para imprimir o contrato gerado no editor ou gerar um PDF.

#### **📍 Processos Admin (`/processes`)**

-   **Tabela de Processos**: Visão completa de todos os processos administrativos, com colunas detalhadas (Status, Código, Andamento, Tipo, Categoria, etc.).
-   **Sistema de Pendências**: Permite marcar um processo com "Pendência" e adicionar uma observação, que fica visível para todos.
-   **Finalização de Processo**: Fluxo onde o administrativo pode finalizar um processo, adicionando uma nota. Esta ação é **sincronizada** e dispara a mesma lógica da "Conclusão de Venda", gerando comissões no financeiro.

#### **📍 Financeiro (`/finance`)**

-   **Abas**:
    -   **Comissões**: Resumo e detalhamento das comissões a pagar e a receber. A visualização é restrita por perfil (corretores veem apenas as suas). O Admin/Financeiro pode alterar o status de pagamento.
    -   **Pagamentos (CLT)**: Lançamento de salários, impostos e outras despesas de pessoal.
    -   **Despesas**: Lançamento de despesas fixas e variáveis, com alertas visuais para contas vencidas.
-   **Lançamentos**: Modais para adicionar novas comissões, pagamentos e despesas.

#### **📍 Agenda (`/agenda`)**

-   **Múltiplas Visões**:
    -   **Minha Agenda**: Eventos pessoais do usuário logado.
    -   **Agenda da Imobiliária**: Eventos gerais, visíveis para todos.
    -   **Visitas da Equipe**: Agenda compartilhada para visitas a imóveis.
-   **Lógica de Permissões**: A visibilidade das abas e a permissão para adicionar eventos são controladas pelo perfil do usuário.

#### **📍 Relatórios (`/reporting`)**

-   **Filtros Abrangentes**: Permite filtrar dados por corretor, equipe, tipo de imóvel, período (data) e tipo de operação (venda vs. captação).
-   **Visualizações**:
    -   **Gráfico de Vendas**: Gráfico de barras dinâmico que reflete os filtros aplicados.
    -   **Tabelas de Captação**: Relatórios sobre imóveis captados por corretor e por tipo.
    -   **Relatório de Desempenho**: Tabela comparando a performance das equipes.

#### **📍 Correspondente Bancário (`/correspondent`)**

-   **Meus Processos**: Tabela onde o correspondente acompanha os processos de financiamento.
-   **Detalhes do Processo**: Um modal de edição extremamente detalhado, com sub-seções para status do cliente, consulta Bacen, engenharia, documentação e etapas do processo.
-   **Solicitações**: Área para corretores solicitarem serviços específicos ao correspondente (aprovação de crédito, laudo, etc.).

#### **📍 Outros Serviços (`/services`)**

-   Módulo com abas para futuras funcionalidades: `Avaliador`, `Jurídico`, `Leilão`, `Despachante` e `Locação`. Atualmente, exibe placeholders.

#### **📍 Configurações (`/settings`)**

-   **Abas**:
    -   **Perfil**: Para o usuário alterar seus dados pessoais e senha (interface pronta).
    -   **Membros da Equipe**: Adicionar e visualizar membros da equipe (disponível para Admin).
    -   **Equipes**: Criar equipes e gerenciar seus membros (disponível para Admin).
    -   **Permissões**: Visualizador que mostra quais módulos cada perfil pode acessar.
