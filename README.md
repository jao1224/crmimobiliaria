# LeadFlow - Painel Imobiliário

Este é o repositório do seu projeto LeadFlow, desenvolvido no Firebase Studio.

---

## Lista de Afazeres

### ✅ Concluído
- **Estrutura Geral e Navegação:**
  - Base da aplicação, layout do painel e navegação funcionais.
- **Módulos Principais (Interface Pronta):**
  - As interfaces para Imóveis, CRM, Negociações, Financeiro, Relatórios e Configurações estão construídas e funcionais em **modo simulado**.
- **Funcionalidades de Contrato:**
  - A interface para gerar, editar e fazer upload de contratos está pronta (em modo simulado).
- **Sistema de Permissões (Visual):**
  - Interface visual para permissões por perfil na página de configurações está pronta (sem lógica funcional).
- **Sistema de Permissões e Acesso Granular:**
    -   **Lógica de Permissões (✅):** Implementar as regras de visibilidade:
        -   Corretor: Vê apenas seus próprios dados.
        -   Gerente/Coordenador: Vê todos os dados de sua equipe.
        -   CEO/Administrativo/Financeiro: Vê todos os dados da imobiliária.
    -   **Gerenciamento de Usuários (✅):** Criar interface na aba "Configurações" para o admin adicionar, remover, editar usuários e definir suas permissções.
    -   **Gerenciamento de Tarefas (✅):** Permitir que o admin atribua tarefas para setores e usuários.
- **Módulo de Agenda:**
    -   **Criar a Página de Agenda (✅):** Desenvolver uma nova seção principal no painel.
    -   **Implementar as 3 Agendas (✅):**
        -   **Agenda Pessoal:** Para todos os usuários.
        -   **Agenda da Imobiliária:** Calendário geral editável apenas pelo Admin.
        -   **Agenda de Visitas da Equipe:** Para Corretores e Gerentes marcarem visitas.
    -   **Lógica de Permissões da Agenda (✅):** Ajustar a visibilidade das agendas para que cada perfil de usuário veja apenas as agendas relevantes para sua função (ex: Admin vê todas, Corretor vê a sua e a da equipe).
- **Módulo Financeiro (Aba "Financeiro"):**
    -   **Gestão de Comissões (✅):**
        -   Interface para o Financeiro lançar comissões (múltiplos envolvidos, valor, status, adiantamentos, data, nota fiscal).
        -   Corretores podem visualizar suas próprias comissões.
    -   **Desenvolver Formulários Financeiros (✅):**
        -   Criar o formulário detalhado para "Lançar Pagamento".
        -   Criar o formulário detalhado para "Lançar Despesa".
    -   **Gestão de Pagamentos (CLT) (✅):**
        -   Interface para registrar salários, impostos, férias, 13º.
    -   **Gestão de Despesas (✅):**
        -   Separar despesas fixas e variáveis.
    -   **Sistema de lembretes para pagamentos e alertas de contas vencidas (✅).**
    -   **Relatórios Financeiros Detalhados (✅):**
        -   Filtros para analisar comissões e despesas por corretor, equipe, período, tipo de imóvel, etc.
- **Sistema de Autenticação e Perfis:**
    -   **Gestão de Plano (Minha Conta) (✅):** Interface para o usuário ver seu plano (mensal, anual, etc.).
- **Relatórios e Filtros Avançados:**
    -   **Relatório de Captações (✅):** Criar relatório para imóveis captados, com filtros por corretor e período.
    -   **Relatório de Desempenho (✅):** Criar relatórios para equipes e corretores.
    -   **Filtros Avançados em Módulos (✅):** Adicionar filtros avançados na página de Processos/Negociações para filtrar por tipo (venda, aluguel, leilão, etc.), status e responsável.
    -   **Filtros de Relatórios (✅):** Implementar a lógica dos filtros na página de relatórios para que funcionem com os dados reais.
- **Novos Módulos e Funcionalidades:**
    -   **Módulo "Outros Serviços" (✅):**
        -   Criar uma seção principal "Outros Serviços" no menu.
        -   Dentro dela, criar as abas/submódulos: `Avaliador`, `Jurídico`, `Leilão`, `Despachante`, `Locação`.
- **Integração de Dados (Simulada):**
    - **Preenchimento Automático (✅):** Garantir que o código de um imóvel ou o CPF de um cliente preencha automaticamente os campos em outras seções (ex: negociações).
    - **Comissão Automática (✅):** Quando uma venda for concluída em "Negociações", a comissão é gerada automaticamente no módulo "Financeiro".
    - **Visão Detalhada do Processo (✅):** Criar uma visão detalhada para cada processo, onde é possível abrir e ver as informações relacionadas.
- **Módulo de Correspondente Bancário (Implementação Detalhada e Simulada):**
    -   **Integração Negociações -> Correspondente (✅):** Criado fluxo onde uma negociação "financiada" gera um processo para o correspondente.
    -   **Visão do Correspondente - "Meus Processos" (✅):** Implementada a tabela de processos e o modal de edição detalhado com todas as seções (Status Cliente, Bacen, Engenharia, Docs, Etapas, etc.).
    -   **Visão do Corretor - "Solicitações ao Correspondente" (✅):** Implementada a área para corretores solicitarem serviços (Aprovação de Crédito, Laudo, Matrícula, Abertura de Conta).
    -   **Sistema de Notificações de Pendências (✅):** Implementado um sistema de alerta visual na tabela de processos para indicar pendências.
- **Sistema de Permissões de Edição (Simulado):**
    -   **Edição por Competência (✅):** Implementada a lógica simulada para que, dentro de um mesmo processo, cada perfil só possa editar sua parte (ex: apenas Admin/Imobiliária podem editar contratos e processos de financiamento).
- **Módulo de Processos Administrativos (Implementação Detalhada e Simulada):**
    -   **Visão Resumida do Processo (Formato "PDF") (✅):**
        -   Transformada a página "Processos Admin" em uma visão detalhada de uma negociação específica.
        -   Criado um cabeçalho não-editável que consolida as informações mais importantes do negócio: Dados da Negociação, Equipe Envolvida, Valores e Responsáveis.
    -   **Área de Ações e Acompanhamento (✅):**
        -   Abaixo do resumo, foram criadas áreas com abas onde os setores responsáveis (simulando Financeiro, Correspondente e Administrativo) podem dar andamento em suas tarefas.
    -   **Navegação e Acesso (✅):** Adicionado um botão "Ver Processo" na tabela de Negociações para simular o acesso ao detalhe do processo administrativo correspondente.
- **Processos, Filtros e Relatórios (Funcionalidades Essenciais):**
    -   **Código Único de Processo (✅):**
        -   Gerado e exibido um código/ID único para cada negociação salva.
        -   Garantido que este código seja visível nas tabelas de Negociações, Processos, Financeiro, etc., para fácil referência.
    -   **Filtros Avançados e Detalhados (✅):**
        -   Implementado filtros por **data** em todos os módulos relevantes (Negociações, Relatórios).
        -   Adicionado filtros por **tipo de imóvel** (casa, apartamento, etc.) nas seções de Negociação e Relatórios.
        -   Criado filtros para distinguir operações de **Captação vs. Venda**.
- **Gestão de Processos (Funcionalidade Essencial):**
    -   **Tabela de Processos (✅):**
        -   Na seção "Processos", criar uma tabela listando todos os processos em que o usuário está envolvido.
        -   **Colunas:** Adicionar colunas para: `Status do Processo` (Ativo, Suspenso, etc.), `Código`, `Status de Andamento` (Em andamento, Pendência), `Tipo de Negociação` (Repasse, Novo, Lote, etc. - deve ser customizável), `Categoria` (Novo, Usado), `Imóvel`, `Vendedor`, `Captador`, `Equipe` e `Observações`.
    -   **Sistema de Pendências (✅):**
        -   Permitir que qualquer envolvido no processo possa marcar uma "Pendência" e adicionar uma observação.
        -   Notificar todos os outros envolvidos sobre a nova pendência e sua descrição.
    -   **Finalização de Processo (✅):**
        -   Quando o processo for finalizado, permitir que o setor Administrativo insira os detalhes finais sobre o que cada parte (corretor, gerente, etc.) tem a receber.


### 🟡 Em Progresso / A Fazer
- **1. Persistência e Integração de Dados (Conectar ao Banco de Dados):**
    -   **Conectar Módulos ao Firestore (🟡):** A tarefa principal. Conectar todas as funcionalidades (CRM, Imóveis, Finanças, Equipes, etc.) ao banco de dados para salvar e carregar as informações de forma persistente.
    -   **Detalhamento Financeiro nas Comissões (❌):**
        -   Incluir detalhes completos do negócio na tela de comissão (requer conexão com o banco de dados): valor do imóvel, captador, vendedor, gerente, sinal do cliente, parcelamento com a construtora, etc.
    -   **Implementar Permissões de Edição Reais (❌):** A lógica simulada está pronta. O próximo passo é conectar ao sistema de autenticação para que as permissões funcionem com usuários e perfis reais.

- **2. Sistema de Autenticação e Perfis:**
    -   **Implementar Autenticação Real (🟡):** Integrar o Firebase Authentication para que o login e o cadastro funcionem com usuários reais.
    -   **Implementar Mudança de Senha (🟡):** Conectar a funcionalidade na página de configurações ("Minha Conta").
    -   **Conectar Perfis de Usuário (🟡):** Salvar os dados do perfil do usuário no Firestore.

- **3. Sistema de Notificações Gerais:**
    -   **Implementar Notificações (🟡):** Enviar alertas para ações importantes no sistema (e-mail, WhatsApp, etc.).
