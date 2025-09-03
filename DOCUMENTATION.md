# Documentação Completa do Projeto: Ideal Imóveis

## 1. Introdução

Este documento fornece uma visão técnica detalhada do projeto **Ideal Imóveis**, uma plataforma de gestão imobiliária desenvolvida no Firebase Studio. O sistema foi projetado para ser uma ferramenta completa e totalmente funcional, com todos os dados persistidos e sincronizados em tempo real com o Firebase (Firestore, Authentication e Storage).

O sistema abrange desde o cadastro de imóveis e clientes até a gestão financeira e de processos complexos, com uma lógica de permissões baseada em perfis de usuário que controla o acesso a cada módulo.

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
-   **/src/lib/**: Arquivos de utilitários e lógica de dados.
    -   **`utils.ts`**: Funções utilitárias, como `cn` para classes CSS.
    -   **`data.ts`, `crm-data.ts`**: Arquivos centrais que contêm a lógica de negócio para interagir com o Firestore (buscar e salvar imóveis, negociações, usuários, etc.).
    -   **`actions.ts`**: Funções de servidor (Server Actions) que interagem com a lógica de IA.
-   **/src/ai/**: Lógica relacionada à Inteligência Artificial com Genkit.
    -   **`genkit.ts`**: Configuração do cliente Genkit.
    -   **`/flows/property-matching.ts`**: Fluxo de IA para combinar imóveis com os requisitos do cliente.
-   **/src/contexts/**: Contextos React para gerenciamento de estado global.
    -   **`ProfileContext.tsx`**: Gerencia o estado do perfil de usuário ativo para simular diferentes visualizações (disponível para o Admin).
-   **/functions/**: Contém as Cloud Functions do Firebase.
    -   **/functions/src/index.ts**: Inclui a lógica para geração de PDF de contratos e o template para envio de e-mails de boas-vindas.

---

## 3. Detalhamento das Funcionalidades

### 3.1. Autenticação e Perfis de Usuário

-   **Login e Registro**: Páginas `/` e `/register` contêm formulários para entrada e criação de contas, totalmente integrados com o **Firebase Authentication**.
-   **Perfis de Usuário**: O sistema utiliza múltiplos perfis (`Admin`, `Imobiliária`, `Corretor Autônomo`, etc.). O cargo do usuário é salvo no Firestore e determina quais rotas e funcionalidades são visíveis, com base na configuração de `menuConfig` em `src/lib/permissions.ts`. Admins podem simular a visualização de outros perfis.

### 3.2. Painel Principal (`/dashboard`)

-   **Visão Geral Dinâmica**: Apresenta quatro cards principais cujos dados são calculados em tempo real a partir do Firestore:
    -   **Receita Total**: Sincronizado com as negociações marcadas como "Venda Concluída".
    -   **Negócios Ativos**: Contagem em tempo real de negociações que não foram concluídas.
    -   **Imóveis Vendidos**: Contagem de negociações concluídas.
    -   **Novos Leads**: Sincronizado com a lista de leads do módulo de CRM.
-   **Relatório de Vendas**: Um gráfico de barras visualiza a receita de vendas por mês, com base nos dados de negociações concluídas no Firestore.

### 3.3. Módulos Detalhados

#### **📍 Imóveis (`/properties`)**

-   **Listagem**: Tabela com todos os imóveis do Firestore, exibindo imagem, nome, endereço, status, preço e captador.
-   **Adicionar/Editar**: Modais para cadastrar novos imóveis ou editar existentes, com upload de imagem para o **Firebase Storage**.
-   **Detalhes**: Um modal exibe todas as informações de um imóvel, incluindo descrição e dados do proprietário.
-   **Combinador de Imóveis (IA)**: Uma funcionalidade que usa Genkit para analisar os requisitos de um cliente (texto livre) e compará-los com a lista de imóveis disponíveis, retornando as melhores correspondências.

#### **📍 CRM (`/crm`)**

-   **Abas**: Organizado em três seções, todas lendo e escrevendo no Firestore:
    1.  **Leads**: Lista de potenciais clientes. Permite converter um lead em cliente.
    2.  **Negócios em Andamento**: Funil de vendas, listando propostas ativas.
    3.  **Clientes**: Base de dados de clientes convertidos.
-   **Ações**: Modais para adicionar novos leads e negócios, que são salvos no banco de dados.

#### **📍 Negociações (`/negotiations`)**

-   **Tabela Central**: Lista todas as negociações do Firestore, com filtros por tipo, status do contrato e responsável.
-   **Iniciar Negociação**: Fluxo para criar uma nova negociação, buscando dados do imóvel e do cliente por seus respectivos IDs para preenchimento automático.
-   **Ações por Negociação**:
    -   **Gerar Contrato**: Redireciona para a página de contrato (`/negotiations/[id]/contract`).
    -   **Ver Processo**: Navega para a visão detalhada do processo administrativo.
    -   **Concluir Venda**: Ação que finaliza a negociação, atualiza seu status no Firestore e **gera automaticamente uma comissão** no módulo Financeiro.

#### **📍 Contrato (`/negotiations/[id]/contract`)**

-   **Anexo e Editor**: Permite duas formas de gerenciar o contrato, ambas salvas no Firestore:
    1.  **Anexar Arquivo**: Upload de um arquivo PDF/Word para o **Firebase Storage**.
    2.  **Editor de Contrato**: Um formulário detalhado que gera um contrato de compra e venda com campos pré-preenchidos, cláusulas editáveis e suporte a múltiplos compradores/vendedores.
-   **Impressão e Geração de PDF**: Funcionalidade que chama uma **Cloud Function** para gerar um PDF do contrato editado e iniciar o download.

#### **📍 Processos Admin (`/processes`)**

-   **Tabela de Processos**: Visão completa de todos os processos administrativos da coleção `processos` no Firestore.
-   **Sistema de Pendências**: Permite marcar um processo com "Pendência" e adicionar uma observação, que fica visível para todos. Esta ação dispara uma notificação.
-   **Finalização de Processo**: Fluxo onde o administrativo pode finalizar um processo, adicionando uma nota. Esta ação é **sincronizada** e dispara a mesma lógica da "Conclusão de Venda", gerando comissões no financeiro.

#### **📍 Financeiro (`/finance`)**

-   **Abas**: Módulo totalmente funcional, lendo e escrevendo nas coleções `comissoes`, `pagamentos` e `despesas`.
    -   **Comissões**: Resumo e detalhamento das comissões a pagar e a receber. A visualização é restrita por perfil.
    -   **Pagamentos (CLT)**: Lançamento de salários, impostos e outras despesas de pessoal.
    -   **Despesas**: Lançamento de despesas fixas e variáveis, com alertas visuais para contas vencidas.
-   **Lançamentos**: Modais para adicionar novas comissões, pagamentos e despesas.

#### **📍 Agenda (`/agenda`)**

-   **Múltiplas Visões**: Totalmente integrado com a coleção `eventos` no Firestore.
    -   **Minha Agenda**: Eventos pessoais do usuário logado.
    -   **Agenda da Imobiliária**: Eventos gerais, visíveis para todos.
    -   **Visitas da Equipe**: Agenda compartilhada para visitas a imóveis.
-   **Lógica de Permissões**: A visibilidade e permissão para adicionar eventos são controladas pelo perfil do usuário.

#### **📍 Relatórios (`/reporting`)**

-   **Filtros Abrangentes**: Permite filtrar dados por corretor, equipe, tipo de imóvel, período (data) e tipo de operação (venda vs. captação). Os dados são buscados do Firestore.
-   **Visualizações**: Gráficos e tabelas dinâmicas que refletem os filtros aplicados.

#### **📍 Correspondente Bancário (`/correspondent`)**

-   **Meus Processos**: Tabela onde o correspondente acompanha os processos de financiamento da coleção `processosFinanciamento`.
-   **Detalhes do Processo**: Um modal de edição detalhado para atualizar cada etapa do financiamento.
-   **Solicitações**: Área para corretores solicitarem serviços específicos, salvos na coleção `solicitacoesServico`.

#### **📍 Outros Serviços (`/services`)**

-   Módulo com abas para futuras funcionalidades: `Avaliador`, `Jurídico`, `Leilão`, `Despachante` e `Locação`. Atualmente, exibe placeholders.

#### **📍 Configurações (`/settings`)**

-   **Abas**:
    -   **Perfil**: Para o usuário alterar seus dados pessoais e senha, com integração ao Firebase Authentication.
    -   **Membros da Equipe**: Adicionar e visualizar membros da equipe (disponível para Admin).
    -   **Equipes**: Criar equipes e gerenciar seus membros (disponível para Admin).
    -   **Permissões**: Visualizador que mostra quais módulos cada perfil pode acessar.
