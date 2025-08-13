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
    -   **Módulo de Processos Administrativos (✅):** Criar uma seção para gerenciar processos internos.
- **Novos Módulos e Funcionalidades:**
    -   **Módulo de Correspondente Bancário (✅):** Criar uma nova seção principal no painel.
    -   **Módulo "Outros Serviços" (✅):**
        -   Criar uma seção principal "Outros Serviços" no menu.
        -   Dentro dela, criar as abas/submódulos: `Avaliador`, `Jurídico`, `Leilão`, `Despachante`, `Locação`.
- **Integração de Dados (Simulada):**
    - **Preenchimento Automático (✅):** Garantir que o código de um imóvel ou o CPF de um cliente preencha automaticamente os campos em outras seções (ex: negociações).
    - **Comissão Automática (✅):** Quando uma venda for concluída em "Negociações", a comissão é gerada automaticamente no módulo "Financeiro".
    - **Visão Detalhada do Processo (✅):** Criar uma visão detalhada para cada processo, onde é possível abrir e ver as informações relacionadas.


### 🟡 Em Progresso / A Fazer

- **1. Persistência e Integração de Dados (Conectar ao Banco de Dados):**
    -   **Conectar Módulos ao Firestore (🟡):** A tarefa principal. Conectar todas as funcionalidades (CRM, Imóveis, Finanças, Equipes, etc.) ao banco de dados para salvar e carregar as informações de forma persistente.
    -   **Detalhamento Financeiro nas Comissões (❌):**
        -   Incluir detalhes completos do negócio na tela de comissão (requer conexão com o banco de dados): valor do imóvel, captador, vendedor, gerente, sinal do cliente, parcelamento com a construtora, etc.

- **2. Módulo de Correspondente Bancário (Implementação Detalhada):**
    -   **Integração Negociações -> Correspondente (❌):**
        -   No formulário de "Nova Negociação", adicionar a opção "Financiado?".
        -   Se "Sim", um novo processo deve ser criado automaticamente na aba "Meus Processos" do Correspondente Bancário.
    -   **Visão do Correspondente - "Meus Processos" (❌):**
        -   Criar uma tabela com todos os processos de financiamento.
        -   Para cada processo, criar uma visão detalhada editável com seções para:
            -   **Status do Cliente:** Aprovado, Reprovado, Condicionado, Bloqueado (com campo para motivo/valor).
            -   **Consulta Bacen:** Campo para informações do Banco Central.
            -   **Engenharia:** Status (Aprovado, Reprovado, Pendência), motivo da pendência, data e valor do laudo.
            -   **Documentação:** Checklist com datas de vencimento para Matrícula, Contracheque, Endereço, Aprovação do Cliente, Laudo de Engenharia.
            -   **Etapas do Processo:** Checklist/Status para "Assinatura de Formulários", "Conformidade", "Recursos para Financiar", "Assinatura no Banco", "Entrada no Cartório", "Garantia".
            -   **Status Geral do Processo:** Ativo, Suspenso, Cancelado, Concluído, etc.
    -   **Visão do Corretor - "Solicitações ao Correspondente" (❌):**
        -   Criar uma área na página do Correspondente onde o Corretor possa:
            -   Solicitar Aprovação de Crédito (com formulário para dados do cliente).
            -   Solicitar Laudo de Engenharia (com formulário para dados do imóvel).
            -   Solicitar Matrícula Atualizada.
            -   Solicitar Abertura de Conta.
    -   **Sistema de Notificações de Pendências (❌):**
        -   Criar um sistema de alertas visuais para que, quando o correspondente marcar uma pendência (ex: na engenharia), todos os envolvidos (corretor, gerente) vejam essa pendência em sua visão do processo.

- **3. Sistema de Permissões de Edição (❌):**
    -   **Edição por Competência:** Implementar a lógica para que, dentro de um mesmo processo de negociação, cada perfil só possa editar sua parte:
        -   **Correspondente:** Edita apenas os campos de financiamento.
        -   **Administrativo:** Edita apenas os campos de contrato.
        -   **Financeiro:** Edita apenas os campos de comissão e valores.
        -   **Corretor Vendedor:** Edita/anexa a documentação do comprador.
        -   **Corretor Captador:** Edita/anexa a documentação do vendedor e do imóvel.

- **4. Sistema de Autenticação e Perfis:**
    -   **Implementar Autenticação Real (🟡):** Integrar o Firebase Authentication para que o login e o cadastro funcionem com usuários reais.
    -   **Implementar Mudança de Senha (🟡):** Conectar a funcionalidade na página de configurações ("Minha Conta").
    -   **Conectar Perfis de Usuário (🟡):** Salvar os dados do perfil do usuário no Firestore.

- **5. Sistema de Notificações Gerais:**
    -   **Implementar Notificações (🟡):** Enviar alertas para ações importantes no sistema (e-mail, WhatsApp, etc.).
