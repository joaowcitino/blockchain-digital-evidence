# Sistema de Gestão de Evidências Digitais

> **Projeto de Blockchain e Evidências Digitais**
> Um sistema completo para gerenciar evidências digitais usando **Blockchain (Vyper)** + **IPFS** com rastreamento completo de **cadeia de custódia**.

---

## 📋 Visão Geral

Este projeto implementa um **sistema de gestão de evidências digitais de nível profissional** que aborda desafios críticos no manuseio de evidências forenses:

- **Integridade**: Hash SHA-256 garante que os arquivos permaneçam inalterados
- **Prova Temporal**: Timestamps na blockchain comprovam a existência em momentos específicos
- **Cadeia de Custódia**: Rastreamento histórico completo de todas as transferências de custódia
- **Controle de Acesso**: Permissões baseadas em funções (RBAC) para Polícia, Laboratório, Juiz e Admin
- **Privacidade**: Sem dados pessoais na blockchain, apenas IDs de caso e hashes

---

## 🏗️ Arquitetura

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Frontend      │─────▶│    Backend API   │─────▶│   Blockchain    │
│   (React)       │      │   (Node/Express) │      │   (Vyper)       │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                   │
                                   ▼
                         ┌──────────────────┐
                         │      IPFS        │
                         │  (Armazenamento) │
                         └──────────────────┘
```

### Stack Tecnológico

| Camada | Tecnologia |
|--------|-----------|
| **Smart Contract** | Vyper 0.3.7 |
| **Blockchain** | Compatível com EVM (Ganache, Hardhat, Anvil) |
| **Armazenamento** | IPFS |
| **Backend** | Node.js, Express, ethers.js |
| **Frontend** | React, React Router, Axios |
| **Deploy** | Python, Web3.py |

---

## ✨ Funcionalidades

### Funcionalidades Principais

1. **Registro de Evidências** (função POLÍCIA)
   - Upload de arquivos para IPFS
   - Cálculo de hash SHA-256
   - Registro na blockchain com metadados
   - Registro inicial de custódia criado

2. **Cadeia de Custódia** (Qualquer custodiante)
   - Transferência de evidências entre partes autorizadas
   - Trilha de auditoria completa
   - Razão obrigatória para cada transferência
   - Histórico imutável

3. **Gestão de Status** (funções LAB/JUIZ)
   - Máquina de Estados Finita (FSM):
     - Coletado → Em Análise → Arquivado
     - Coletado/Em Análise → Invalidado
   - Sem transições retroativas
   - Estados terminais forçados

4. **Avançado: Múltiplos Arquivos** (função LAB)
   - Anexar laudos periciais à evidência
   - Adicionar resultados de análise
   - Documentação suplementar
   - Cada arquivo com hash e armazenado no IPFS

### Recursos de Segurança

Cada função do smart contract inclui:
- ✅ Validação de função (RBAC)
- ✅ Verificação de existência da evidência
- ✅ Validação de transição de estado (FSM)
- ✅ Validação de entrada (não vazio, não zero)
- ✅ Validação de endereço
- ✅ Garantias de imutabilidade
- ✅ Emissão de eventos para todas as mudanças de estado

---

## 📁 Estrutura do Projeto

```
blockchain-digital-evidence/
├── contracts/                    # Smart contracts Vyper
│   └── DigitalEvidence.vy       # Contrato principal de evidências
│
├── backend/                      # Backend Node.js API
│   ├── src/
│   │   ├── config/              # Configuração e ABI
│   │   ├── controllers/         # Handlers de requisição
│   │   ├── services/            # Serviços de Blockchain e IPFS
│   │   ├── routes/              # Rotas da API
│   │   ├── middleware/          # Upload e tratamento de erros
│   │   ├── utils/               # Utilitários de hash
│   │   └── app.js               # Aplicação principal
│   ├── package.json
│   └── .env.example
│
├── frontend/                     # Frontend React
│   ├── src/
│   │   ├── pages/               # Componentes de página
│   │   ├── services/            # Serviço de API
│   │   ├── styles/              # Estilos CSS
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   ├── package.json
│   └── .env.example
│
├── scripts/                      # Scripts de deploy
│   ├── deploy.py                # Script Python de deploy
│   └── manage_roles.py          # Script de gestão de funções
│
├── requirements.txt              # Dependências Python
├── .gitignore
└── README.md
```

---

## 🚀 Início Rápido

### Pré-requisitos

- **Node.js** (v16+)
- **Python** (v3.8+)
- **Vyper** (v0.3.7+)
- Daemon **IPFS**
- Nó **Blockchain** (Ganache, Hardhat ou Anvil)

### Instalação

#### 1. Instalar Dependências Python

```bash
pip install -r requirements.txt
```

#### 2. Instalar Dependências do Backend

```bash
cd backend
npm install
```

#### 3. Instalar Dependências do Frontend

```bash
cd ../frontend
npm install
```

### Configuração

#### 1. Iniciar Nó Blockchain

**Opção A: Ganache**
```bash
ganache --port 8545 --deterministic
```

**Opção B: Hardhat**
```bash
npx hardhat node
```

**Opção C: Foundry Anvil**
```bash
anvil
```

#### 2. Iniciar Daemon IPFS

```bash
ipfs daemon
```

#### 3. Configurar Ambiente

**Backend** (`backend/.env`):
```env
PORT=3001
NODE_ENV=development

BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=0x...  # Será definido pelo script de deploy
PRIVATE_KEY=0x...       # Sua chave privada

IPFS_HOST=localhost
IPFS_PORT=5001
IPFS_PROTOCOL=http
IPFS_GATEWAY=http://127.0.0.1:8080/ipfs/

CORS_ORIGIN=http://localhost:3000
```

**Frontend** (`frontend/.env`):
```env
REACT_APP_API_URL=http://localhost:3001/api
```

#### 4. Fazer Deploy do Smart Contract

```bash
# Da raiz do projeto
python scripts/deploy.py
```

Isso irá:
- Compilar o contrato Vyper
- Fazer deploy na sua blockchain
- Salvar o endereço do contrato em `backend/.env`
- Salvar o ABI em `backend/src/config/contractABI.json`

#### 5. Conceder Funções (Opcional)

Use o script de gestão de funções:

```bash
# Conceder função POLÍCIA
python scripts/manage_roles.py grant 0xENDEREÇO police

# Conceder função LAB
python scripts/manage_roles.py grant 0xENDEREÇO lab

# Conceder função JUIZ
python scripts/manage_roles.py grant 0xENDEREÇO judge

# Verificar funções
python scripts/manage_roles.py check 0xENDEREÇO
```

#### 6. Iniciar Backend

```bash
cd backend
npm start
```

Backend rodará em `http://localhost:3001`

#### 7. Iniciar Frontend

```bash
cd frontend
npm start
```

Frontend rodará em `http://localhost:3000`

---

## 📖 Guia de Uso

### 1. Registrar Evidência

1. Vá para a página **Registrar Evidência**
2. Faça upload do arquivo (qualquer tipo, máx 50MB)
3. Insira o ID do Caso (ex: CASO-2024-001)
4. Insira a descrição
5. Clique em **Registrar Evidência**

**Resultado**: Arquivo enviado para o IPFS, hash calculado, evidência registrada na blockchain.

### 2. Ver Lista de Evidências

1. Vá para a página **Lista de Evidências**
2. Veja todas as evidências registradas
3. Clique em qualquer evidência para ver detalhes

### 3. Ver Detalhes da Evidência

Mostra:
- Hash do arquivo (SHA-256)
- CID IPFS com link para gateway
- Criador e custodiante atual
- Status
- Linha do tempo completa da cadeia de custódia
- Arquivos adicionais (se houver)

### 4. Transferir Custódia

1. Abra os detalhes da evidência
2. Clique em **Transferir Custódia**
3. Insira o endereço do novo custodiante
4. Insira a razão
5. Envie

**Requisito**: Apenas o custodiante atual pode transferir.

### 5. Alterar Status

1. Abra os detalhes da evidência
2. Clique em **Alterar Status**
3. Selecione o novo status
4. Envie

**Requisitos**:
- Apenas função LAB ou JUIZ
- Deve seguir as regras da FSM

### 6. Adicionar Arquivo à Evidência

1. Abra os detalhes da evidência
2. Clique em **Adicionar Arquivo**
3. Faça upload do arquivo
4. Insira o tipo de arquivo (ex: "Laudo Pericial")
5. Envie

**Requisito**: Apenas função LAB pode adicionar arquivos.

---

## 🔐 Referência do Smart Contract

### Funções

| Função | Valor | Permissões |
|--------|-------|------------|
| ADMIN | 1 | Gerenciar funções |
| POLICE | 2 | Registrar evidências |
| LAB | 4 | Alterar status, adicionar arquivos |
| JUDGE | 8 | Alterar status |

### FSM de Status da Evidência

```
Coletado (0) ──▶ Em Análise (1) ──▶ Arquivado (2)
    │                   │
    └──▶ Invalidado (3) ◀──┘
         (terminal)
```

### Funções Principais

#### `register_evidence(file_hash, ipfs_cid, description, case_id) -> uint256`
Registra nova evidência. Apenas função POLÍCIA.

#### `transfer_custody(evidence_id, new_custodian, reason)`
Transfere custódia. Apenas custodiante atual.

#### `set_status(evidence_id, new_status)`
Altera status. Apenas LAB ou JUIZ. Deve seguir FSM.

#### `add_file_to_evidence(evidence_id, file_hash, ipfs_cid, file_type)`
Adiciona arquivo adicional. Apenas função LAB.

#### `get_evidence(evidence_id) -> Evidence`
Obtém detalhes da evidência.

#### `get_custody_history(evidence_id) -> CustodyEvent[]`
Obtém histórico completo de custódia.

#### `verify_integrity(evidence_id, file_hash) -> bool`
Verifica se o hash do arquivo corresponde.

---

## 🧪 Testes

### Fluxo de Testes Manuais

1. **Configuração**: Deploy do contrato, iniciar serviços
2. **Registro**: Criar 2-3 itens de evidência com arquivos diferentes
3. **Transferência**: Transferir custódia entre diferentes endereços
4. **Status**: Alterar status através da FSM (Coletado → Em Análise → Arquivado)
5. **Arquivos**: Adicionar laudos periciais às evidências
6. **Verificação**: Verificar histórico de custódia, baixar do IPFS, verificar hashes

### Resultados Esperados

- ✅ Todas as transações bem-sucedidas
- ✅ Eventos emitidos corretamente
- ✅ Histórico de custódia preciso
- ✅ Arquivos recuperáveis do IPFS
- ✅ Hashes correspondem aos arquivos originais
- ✅ Transições inválidas rejeitadas

---

## 🛡️ Considerações de Segurança

### Segurança do Smart Contract

1. **Controle de Acesso**: Toda função que altera estado verifica a função do chamador
2. **Validação de Entrada**: Todas as entradas validadas (não vazio, não zero)
3. **Guardas de Estado**: FSM previne transições de estado inválidas
4. **Reentrância**: Sem chamadas externas em funções que alteram estado
5. **Overflow de Inteiros**: Vyper previne por padrão
6. **Imutabilidade**: Dados principais da evidência não podem ser modificados

### Segurança do Backend

1. **Limites de Tamanho**: Máximo de 50MB por arquivo
2. **CORS**: Restrito à origem do frontend
3. **Helmet**: Headers de segurança habilitados
4. **Validação de Entrada**: Todas as entradas da API validadas
5. **Tratamento de Erros**: Erros registrados, não expostos ao cliente
6. **Chave Privada**: Armazenada em variáveis de ambiente

### Segurança do IPFS

1. **Pinning**: Arquivos fixados para prevenir coleta de lixo
2. **Verificação de CID**: Endereçamento por conteúdo garante integridade
3. **Gateway**: Gateway público para acesso somente leitura

---

## 📚 Recursos Adicionais

- **Documentação Vyper**: https://docs.vyperlang.org/
- **Documentação IPFS**: https://docs.ipfs.tech/
- **Documentação Ethers.js**: https://docs.ethers.org/
- **Documentação React**: https://react.dev/
