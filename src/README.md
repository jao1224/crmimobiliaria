# Ideal Imóveis - Painel Imobiliário

Este é o repositório do seu projeto Ideal Imóveis, desenvolvido no Firebase Studio. O sistema está totalmente integrado com o Firebase, com todas as funcionalidades conectadas a um banco de dados real e sistema de autenticação.

---

## Lista de Funcionalidades Implementadas

### ✅ Cadastro de Pessoas
-   [✅] Cadastro de clientes (compradores e vendedores).
-   [✅] Corretores podem preencher e gerenciar clientes através do módulo de CRM.

### ✅ Processos
-   [✅] **Negociação:** Acompanhamento de propostas e funil de vendas.
-   [✅] **Contrato:** Geração, edição e upload de contratos de compra e venda.
-   [✅] **Andamento:** Visualização detalhada do andamento de cada processo.

### ✅ Administrativo
-   [✅] **Meus Processos:** Visão completa de todas as negociações e seus status.
-   [✅] **Cadastrar Usuários e Permissões:** Gerenciamento de membros da equipe, papéis e acessos.
-   [✅] **Tarefas da Equipe e Agenda da Imobiliária:** Ferramentas para atribuição e acompanhamento.
-   [✅] **Visualizar Comissão:** Acesso a todas as comissões geradas.
-   [✅] **Relatórios com Filtros:** Análise de desempenho com filtros detalhados.

### ✅ Financeiro
-   [✅] **Gestão de Comissões:** Editar e acompanhar comissões a pagar e a receber.
-   [✅] **Pagamentos:** Registrar salários (CLT) e impostos.
-   [✅] **Despesas:** Lançar e controlar despesas fixas e variáveis.
-   [✅] **Relatórios:** Acesso a relatórios financeiros detalhados.
-   [✅] **Detalhamento Financeiro nas Comissões:** Inclusão de detalhes completos do negócio na tela de comissão.

### ✅ Agenda
-   [✅] **Agenda Pessoal:** Para compromissos individuais de cada usuário.
-   [✅] **Agenda Geral:** Calendário da imobiliária, editável pelo admin.
-   [✅] **Agenda de Equipe:** Para agendamento de visitas e atendimentos em grupo.

### ✅ Correspondente Bancário
-   [✅] **Meus Processos:** Tabela para acompanhar os processos de financiamento.
-   [✅] **Solicitações:** Formulários para solicitar serviços como:
    -   Aprovação de Crédito
    -   Laudo de Engenharia
    -   Abertura de Conta
    -   Matrícula Atualizada

### ✅ Outros Serviços
-   [✅] Módulo com abas para Avaliador, Jurídico, Leilão, Despachante e Locação.

### ⚙️ Sistema e Back-end
-   [✅] **Persistência e Integração de Dados:** Todos os módulos estão conectados ao Firestore para salvar e carregar as informações de forma persistente.
-   [✅] **Sistema de Autenticação e Perfis:** Implementada autenticação real com Firebase Authentication, incluindo login, cadastro e mudança de senha.
-   [✅] **Permissões de Edição Reais:** A lógica de permissões está conectada ao sistema de autenticação, funcionando com usuários e perfis reais.
-   [✅] **Sistema de Notificações Gerais:** Notificações são geradas e exibidas na interface para ações importantes.

### 🟡 Próximos Passos (A Fazer)
-   [🟡] **Notificações Externas:** Implementar o envio de alertas para ações importantes no sistema via e-mail ou WhatsApp (a base da Cloud Function já está pronta).
-   [🟡] **Melhorias de UI/UX:** Refinar a interface, adicionar animações e melhorar a usabilidade geral.
-   [🟡] **Otimização de Performance:** Analisar e otimizar as consultas ao Firestore para garantir que a aplicação permaneça rápida com um grande volume de dados.
-   [🟡] **Configurar Regras de Segurança:** Revisar e fortalecer as regras de segurança do Firestore para garantir o acesso correto aos dados em produção.
