# LeadFlow - Painel Imobiliário

Este é o repositório do seu projeto LeadFlow, desenvolvido no Firebase Studio.

---

## Lista de Afazeres

### 1. Sistema de Permissões e Acesso Granular
-   🟡 **Lógica de Permissões:** Implementar as regras de visibilidade:
    -   **Corretor:** Vê apenas seus próprios dados (negociações, comissões, etc.).
    -   **Gerente/Coordenador:** Vê todos os dados de sua equipe.
    -   **CEO/Administrativo/Financeiro:** Vê todos os dados de toda a imobiliária.
-   🟡 **Gerenciamento de Usuários (Admin):** Criar interface na aba "Configurações" para o admin:
    -   Adicionar, remover e editar usuários.
    -   Definir permissões (o que cada perfil pode ver e editar).
-   🟡 **Gerenciamento de Tarefas (Admin):** Permitir que o admin atribua tarefas para setores e usuários.

### 2. Módulo de Agenda
-   🟡 **Criar a Página de Agenda:** Desenvolver uma nova seção principal no painel.
-   🟡 **Implementar as 3 Agendas:**
    -   **Agenda Pessoal:** Funcional para todos os usuários registrarem seus próprios compromissos.
    -   **Agenda da Imobiliária:** Calendário geral onde apenas o **Admin** pode adicionar/editar eventos (treinamentos, reuniões gerais). Outros usuários apenas visualizam.
    -   **Agenda de Visitas da Equipe:** Um calendário compartilhado para **Corretores e Gerentes** marcarem visitas, evitando conflitos de horário.

### 3. Módulo Financeiro (Aba "Financeiro")
-   🟡 **Gestão de Comissões:**
    -   Interface para o **Financeiro** lançar e gerenciar comissões de todos os envolvidos (corretores, gerentes, parceiros, captadores).
    -   Campos para: múltiplos envolvidos, valor, status (pago/a receber), adiantamentos, data e anexo de nota fiscal.
    -   **Corretores** podem visualizar suas próprias comissões.
-   🟡 **Gestão de Pagamentos (CLT):**
    -   Interface para registrar pagamentos de salários, com campos para impostos (IR, FGTS), férias, 13º.
-   🟡 **Gestão de Despesas:**
    -   Separar despesas **fixas** (aluguel, água, luz) e **variáveis** (campanhas, patrocínios).
    -   Sistema de lembretes para pagamentos futuros e alertas de contas vencidas.
-   🟡 **Relatórios Financeiros Detalhados:**
    -   Filtros avançados para analisar comissões e despesas por corretor, equipe, período (semana, mês, ano), tipo de imóvel, etc.

### 4. Conectar Módulos ao Banco de Dados (Firestore)
-   🟡 **Persistência de Dados:** Conectar todas as funcionalidades (CRM, Imóveis, Finanças, Equipes, etc.) ao banco de dados para salvar e carregar as informações de forma persistente.

### 5. Sistema de Autenticação e Perfis
-   🟡 **Implementar Autenticação Real:** Integrar o Firebase Authentication para que o login e o cadastro funcionem com usuários reais.
-   🟡 **Implementar Mudança de Senha:** Conectar a funcionalidade na página de configurações.
-   🟡 **Conectar Perfis de Usuário:** Salvar os dados do perfil do usuário no Firestore.

### 6. Relatórios e Filtros Avançados
-   🟡 **Filtros em Módulos:** Adicionar filtros avançados nas páginas de Negociação, Contratos, Processos e Comissões para análise detalhada de desempenho.
-   🟡 **Filtros de Relatórios:** Implementar os filtros na página de relatórios para que funcionem com os dados reais do Firestore.

### 7. Sistema de Notificações
-   🟡 **Implementar Notificações:** Enviar alertas para ações importantes no sistema (e-mail, WhatsApp, etc.).