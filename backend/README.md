# Estoque+

API REST para gerenciamento de estoque, produtos, categorias, movimentações e vendas. O projeto usa Node.js, Express e MySQL; os dados de estoque são calculados a partir das movimentações de entrada e saída.

## Funcionalidades

- Consulta de categorias e cadastro, consulta, atualização, ativação/inativação e exclusão de produtos.
- Registro e consulta do histórico de movimentações, com validação de saldo nas saídas.
- Registro de vendas com um ou mais itens e baixa automática no estoque.
- Consulta de vendas e relatório por período.
- Indicadores de estoque, produtos mais vendidos e resumo de movimentações recentes.

## Tecnologias

- Node.js e CommonJS
- Express 5
- MySQL 8 (compatível com o cliente `mysql2`)
- Knex
- MQTT (dependência presente no projeto)

## Pré-requisitos

- Node.js e npm instalados.
- MySQL em execução e acesso para criar o banco de dados.

## Instalação e configuração

1. Instale as dependências na pasta `backend`:

   ```bash
   npm install
   ```

2. Crie o banco e as tabelas executando o script `model/database_script/estoque+.sql` no MySQL. O script cria e seleciona o banco `db_estoque_mais`.

3. Copie `.env.example` para `.env` e preencha as configurações de conexão com seu MySQL. O arquivo `.env` é ignorado pelo Git; não compartilhe nem versione credenciais reais.

4. Opcionalmente, carregue os dados de demonstração executando `model/database_script/dados_iniciais.sql` depois de criar as tabelas.

   **Atenção:** esse script apaga os registros existentes nas tabelas antes de inserir os dados de exemplo. Não o execute em uma base com dados que deseja preservar.

## Executar a API

Na pasta `backend`:

```bash
node --env-file=.env app.js
```

O servidor fica disponível em `http://localhost:9090`. Não há script `start` configurado no `package.json` atualmente.

## Rotas

Todas as rotas usam o prefixo `/v1/estoque`. A API aceita JSON nos endpoints que recebem corpo de requisição.

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/categoria` | Lista categorias. |
| `POST` | `/produto` | Cadastra produto. |
| `GET` | `/produto` | Lista produtos com saldo e situação do estoque. |
| `GET` | `/produto/:id` | Consulta produto pelo identificador. |
| `PUT` | `/produto/:id` | Atualiza os dados do produto. |
| `PATCH` | `/produto/:id/ativo` | Ativa ou inativa produto sem apagar o histórico. |
| `DELETE` | `/produto/:id` | Exclui produto quando não houver histórico relacionado. |
| `GET` | `/movimentacoes/tipos` | Lista tipos de movimentação. |
| `POST` | `/movimentacoes` | Registra entrada ou saída de estoque. |
| `GET` | `/movimentacoes` | Lista movimentações com filtros opcionais. |
| `POST` | `/vendas` | Registra venda e seus itens. |
| `GET` | `/vendas` | Lista vendas; aceita filtros de período. |
| `GET` | `/vendas/:id` | Consulta venda e seus itens pelo identificador. |
| `GET` | `/vendas/relatorio` | Gera relatório de vendas, com filtros de período opcionais. |
| `GET` | `/dashboard/resumo` | Retorna indicadores gerais de estoque e vendas. |
| `GET` | `/dashboard/mais-vendidos` | Lista os produtos mais vendidos. |
| `GET` | `/dashboard/movimentos` | Resume entradas e saídas dos últimos 14 dias. |

### Filtros

- Vendas e relatório: `data_inicio` e `data_fim`.
- Movimentações: `id_produto`, `id_tipo_movimentacao`, `data_inicio` e `data_fim`.
- Datas devem usar o formato `AAAA-MM-DD`.
- Os tipos de movimentação são `1` (Entrada) e `2` (Saída).

Exemplos:

```text
GET /v1/estoque/movimentacoes?id_produto=1&data_inicio=2026-10-01&data_fim=2026-10-31
GET /v1/estoque/vendas?data_inicio=2026-10-01&data_fim=2026-10-31
GET /v1/estoque/vendas/relatorio?data_inicio=2026-10-01&data_fim=2026-10-31
```

## Exemplos de requisição

### Cadastrar produto

```http
POST /v1/estoque/produto
Content-Type: application/json
```

```json
{
  "nome": "Cimento CP II 50kg",
  "descricao": "Saco de cimento de 50 kg",
  "preco_unitario": 32.5,
  "estoque_minimo": 20,
  "id_categoria": 1
}
```

### Registrar movimentação

```http
POST /v1/estoque/movimentacoes
Content-Type: application/json
```

```json
{
  "id_produto": 1,
  "id_tipo_movimentacao": 1,
  "quantidade": 10,
  "observacao": "Reposição de fornecedor"
}
```

Para registrar uma saída, use `id_tipo_movimentacao: 2`. A operação é recusada se não houver saldo suficiente.

### Registrar venda

```http
POST /v1/estoque/vendas
Content-Type: application/json
```

```json
{
  "itens": [
    {
      "id_produto": 1,
      "quantidade": 2
    },
    {
      "id_produto": 2,
      "quantidade": 1
    }
  ]
}
```

O total da venda é calculado com os preços atuais dos produtos. A venda gera as movimentações de saída correspondentes.

## Estrutura do projeto

```text
controller/                 Validação e coordenação das operações da API
model/DAO/                   Acesso ao banco de dados
model/database_config/       Configuração de conexão do Knex
model/database_script/       Scripts de estrutura e dados do banco
routes/                      Definição das rotas Express
services/                    Regras compartilhadas de estoque e vendas
app.js                       Inicialização do servidor e montagem das rotas
```

## Observações

- A API usa CORS com origem `*` na configuração atual; ajuste essa política antes de expor o serviço em produção.
- O saldo de estoque depende do histórico registrado em `tbl_movimentacao`.
- A rota de categorias está atualmente no singular: `/v1/estoque/categoria`.
