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


### 🟡 Em Progresso / A Fazer

- **1. Sistema de Permissões e Acesso Granular:**
    -   **Lógica de Permissões (❌):** Implementar as regras de visibilidade:
        -   Corretor: Vê apenas seus próprios dados.
        -   Gerente/Coordenador: Vê todos os dados de sua equipe.
        -   CEO/Administrativo/Financeiro: Vê todos os dados da imobiliária.
    -   **Gerenciamento de Usuários (❌):** Criar interface na aba "Configurações" para o admin adicionar, remover, editar usuários e definir suas permissões.
    -   **Gerenciamento de Tarefas (❌):** Permitir que o admin atribua tarefas para setores e usuários.

- **2. Módulo de Agenda:**
    -   **Criar a Página de Agenda (❌):** Desenvolver uma nova seção principal no painel.
    -   **Implementar as 3 Agendas (❌):**
        -   **Agenda Pessoal:** Para todos os usuários.
        -   **Agenda da Imobiliária:** Calendário geral editável apenas pelo Admin.
        -   **Agenda de Visitas da Equipe:** Para Corretores e Gerentes marcarem visitas.

- **3. Módulo Financeiro (Aba "Financeiro"):**
    -   **Gestão de Comissões (❌):**
        -   Interface para o Financeiro lançar comissões (múltiplos envolvidos, valor, status, adiantamentos, data, nota fiscal).
        -   Corretores podem visualizar suas próprias comissões.
    -   **Gestão de Pagamentos (CLT) (❌):**
        -   Interface para registrar salários, impostos, férias, 13º.
    -   **Gestão de Despesas (❌):**
        -   Separar despesas fixas e variáveis.
        -   Sistema de lembretes para pagamentos e alertas de contas vencidas.
    -   **Relatórios Financeiros Detalhados (❌):**
        -   Filtros para analisar comissões e despesas por corretor, equipe, período, tipo de imóvel, etc.

- **4. Conectar Módulos ao Banco de Dados (Firestore):**
    -   **Persistência de Dados (❌):** Conectar todas as funcionalidades (CRM, Imóveis, Finanças, Equipes, etc.) ao banco de dados para salvar e carregar as informações.

- **5. Sistema de Autenticação e Perfis:**
    -   **Implementar Autenticação Real (❌):** Integrar o Firebase Authentication.
    -   **Implementar Mudança de Senha (❌):** Conectar a funcionalidade na página de configurações.
    -   **Conectar Perfis de Usuário (❌):** Salvar os dados do perfil do usuário no Firestore.

- **6. Relatórios e Filtros Avançados:**
    -   **Filtros em Módulos (❌):** Adicionar filtros avançados nas páginas de Negociação, Contratos, Processos e Comissões.
    -   **Filtros de Relatórios (❌):** Implementar os filtros na página de relatórios para que funcionem com os dados reais.

- **7. Sistema de Notificações:**
    -   **Implementar Notificações (❌):** Enviar alertas para ações importantes no sistema (e-mail, WhatsApp, etc.).
