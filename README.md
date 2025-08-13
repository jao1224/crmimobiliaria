# LeadFlow - Painel Imobiliário

Este é o repositório do seu projeto LeadFlow, desenvolvido no Firebase Studio.

---

## Lista de Afazeres

### ✅ Funcionalidades Implementadas (Modo Simulado)

-   **📍 Cadastro de Pessoas**
    -   [✅] Cadastro de clientes (compradores e vendedores).
    -   [✅] Corretores podem preencher e gerenciar clientes através do módulo de CRM.

-   **📍 Processos**
    -   [✅] **Negociação:** Acompanhamento de propostas e funil de vendas.
    -   [✅] **Contrato:** Geração, edição e upload de contratos de compra e venda.
    -   [✅] **Andamento:** Visualização detalhada do andamento de cada processo.

-   **📍 Administrativo**
    -   [✅] **Meus Processos:** Visão completa de todas as negociações e seus status.
    -   [✅] **Cadastrar Usuários e Permissões:** Gerenciamento de membros da equipe, papéis e acessos.
    -   [✅] **Tarefas da Equipe e Agenda da Imobiliária:** Ferramentas para atribuição e acompanhamento.
    -   [✅] **Visualizar Comissão:** Acesso a todas as comissões geradas.
    -   [✅] **Relatórios com Filtros:** Análise de desempenho com filtros detalhados.

-   **📍 Financeiro**
    -   [✅] **Gestão de Comissões:** Editar e acompanhar comissões a pagar e a receber.
    -   [✅] **Pagamentos:** Registrar salários (CLT) e impostos.
    -   [✅] **Despesas:** Lançar e controlar despesas fixas e variáveis.
    -   [✅] **Relatórios:** Acesso a relatórios financeiros detalhados.

-   **📍 Agenda**
    -   [✅] **Agenda Pessoal:** Para compromissos individuais de cada usuário.
    -   [✅] **Agenda Geral:** Calendário da imobiliária, editável pelo admin.
    -   [✅] **Agenda de Equipe:** Para agendamento de visitas e atendimentos em grupo.

-   **📍 Correspondente Bancário**
    -   [✅] **Meus Processos:** Tabela para acompanhar os processos de financiamento.
    -   [✅] **Solicitações:** Formulários para solicitar serviços como:
        -   Aprovação de Crédito
        -   Laudo de Engenharia
        -   Abertura de Conta
        -   Matrícula Atualizada

-   **📍 Outros Serviços**
    -   [✅] Módulo com abas para Avaliador, Jurídico, Leilão, Despachante e Locação.

### 🟡 Próximos Passos (A Fazer)

-   **1. Persistência e Integração de Dados (Conectar ao Banco de Dados):**
    -   [🟡] **Conectar Módulos ao Firestore:** A tarefa principal. Conectar todas as funcionalidades (CRM, Imóveis, Finanças, Equipes, etc.) ao banco de dados para salvar e carregar as informações de forma persistente.
    -   [❌] **Detalhamento Financeiro nas Comissões:** Incluir detalhes completos do negócio na tela de comissão (requer conexão com o banco de dados): valor do imóvel, captador, vendedor, gerente, sinal do cliente, parcelamento com a construtora, etc.
    -   [❌] **Implementar Permissões de Edição Reais:** A lógica simulada está pronta. O próximo passo é conectar ao sistema de autenticação para que as permissões funcionem com usuários e perfis reais.

-   **2. Sistema de Autenticação e Perfis:**
    -   [🟡] **Implementar Autenticação Real:** Integrar o Firebase Authentication para que o login e o cadastro funcionem com usuários reais.
    -   [🟡] **Implementar Mudança de Senha:** Conectar a funcionalidade na página de configurações ("Minha Conta").
    -   [🟡] **Conectar Perfis de Usuário:** Salvar os dados do perfil do usuário no Firestore.

-   **3. Sistema de Notificações Gerais:**
    -   [🟡] **Implementar Notificações:** Enviar alertas para ações importantes no sistema (e-mail, WhatsApp, etc.).