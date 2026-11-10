# Estoque+

## Sobre o projeto

O Estoque+ é um sistema web para controle de produtos, estoque e vendas, criado a partir de uma necessidade real de um negócio familiar.

Antes do sistema, o estoque era acompanhado em uma planilha do Excel. Embora funcionasse, cada entrada e saída exigia atualizar informações manualmente, conferir os saldos e preparar os totais e relatórios de vendas no fim do mês. Essa rotina tomava tempo e tornava mais fácil cometer erros ou deixar informações desatualizadas.

O projeto nasceu para simplificar essa rotina: em vez de depender de atualizações repetidas em várias células, as operações são registradas em um só lugar e o saldo é calculado a partir do histórico de movimentações. Assim, uma venda registrada também gera a baixa dos produtos vendidos, e os dados ficam disponíveis para consulta e para os resumos do sistema.

## Objetivo do projeto

O objetivo do Estoque+ é reduzir o trabalho manual no controle diário de estoque e vendas e oferecer uma visão mais clara e centralizada da operação. A aplicação ajuda quem administra o negócio a acompanhar o que tem disponível, o que precisa de reposição, quais movimentações ocorreram e quais produtos foram vendidos.

Como objetivos específicos, o sistema permite:

- centralizar o cadastro de produtos e categorias, incluindo preço e estoque mínimo;
- atualizar o saldo com base nas entradas e saídas registradas, em vez de depender de cálculos manuais;
- avisar quando um produto ativo chega ao limite mínimo ou fica abaixo dele;
- manter um histórico consultável das movimentações e dos motivos informados;
- relacionar cada venda aos seus itens e às respectivas baixas no estoque;
- facilitar o acompanhamento com indicadores e relatórios mensais.

### Público e escopo

O sistema foi feito sob medida para a rotina do negócio da família e pode servir a pequenos negócios ou equipes com uma necessidade semelhante de acompanhar produtos, estoque e vendas em uma interface simples. Também é um projeto de aprendizado que reúne frontend, API e banco de dados em uma aplicação completa.

O Estoque+ é uma ferramenta de gestão operacional: os indicadores e relatórios ajudam a acompanhar os registros feitos no sistema, mas não substituem controles fiscais, contábeis ou financeiros especializados. A qualidade dos saldos depende de registrar as movimentações corretamente e manter os dados atualizados.

## Como funciona

O uso típico do sistema segue este fluxo:

1. Os produtos são cadastrados e organizados por categoria, com preço e quantidade mínima desejada.
2. Entradas e saídas são registradas como movimentações. O saldo disponível é calculado a partir desse histórico, em vez de ser um valor independente.
3. Ao registrar uma venda, o sistema salva a venda e seus itens e registra automaticamente a saída correspondente no estoque. A operação verifica se há saldo suficiente.
4. O painel e a área de vendas apresentam resumos para ajudar a acompanhar os níveis de estoque e o desempenho das vendas. Produtos inativados deixam de ser oferecidos em novas operações e não geram alertas de estoque baixo.

O projeto é dividido em três partes: a interface web, que permite consultar e operar o sistema; uma API, que valida e processa as operações; e um banco MySQL, que armazena produtos, categorias, vendas, itens e movimentações.

## Funcionalidades

- Cadastro e edição de produtos, organizados por categoria.
- Ativação e inativação de produtos sem apagar o histórico.
- Consulta de saldo calculado e alertas para produtos ativos com estoque baixo.
- Registro e consulta do histórico de entradas e saídas, incluindo motivo da movimentação.
- Registro de vendas com um ou mais produtos e baixa automática das quantidades vendidas.
- Painel com indicadores de estoque, movimentações recentes e produtos mais vendidos.
- Relatório mensal de vendas, que pode ser impresso ou salvo como PDF pelo navegador.

## Tecnologias

- Frontend: Vue 3, TypeScript, Vite e Tailwind CSS.
- API: Node.js, Express e Knex.
- Banco de dados: MySQL, acessado pelo driver `mysql2`.

## Pré-requisitos

- Windows (para usar o script `iniciar-estoque.bat`).
- Node.js `22.18.x` ou `24.12+` e npm.
- MySQL em execução.

## Configuração inicial

1. Clone ou copie o projeto para o computador.
2. Crie o banco e as tabelas executando `backend/model/database_script/estoque+.sql` no MySQL. O script cria o banco `db_estoque_mais`.
3. Copie `backend/.env.example` para `backend/.env` e configure os dados do seu MySQL. O arquivo `.env` é ignorado pelo Git; não compartilhe nem versione credenciais reais.
4. Instale as dependências do frontend e da API, em terminais separados:

   ```powershell
   # Na pasta raiz do projeto
   npm install

   # Na pasta backend
   npm install
   ```

### Dados de demonstração

O arquivo `backend/model/database_script/dados_iniciais.sql` insere categorias e produtos de exemplo, além de vendas e movimentações. **Atenção: ele apaga os dados das tabelas antes de inserir os exemplos.** Execute-o somente em um banco descartável ou depois de fazer uma cópia de segurança.

## Como executar

### Windows

Depois de concluir a configuração e instalar as dependências, execute `iniciar-estoque.bat` na raiz do projeto. O script abre a API e o frontend em janelas separadas e acessa a interface em `http://localhost:5173`.

Mantenha as duas janelas abertas enquanto estiver usando o sistema.

### Iniciar manualmente

Abra um terminal na pasta `backend` e inicie a API:

```powershell
node --env-file=.env app.js
```

Em outro terminal, na pasta raiz do projeto, inicie o frontend:

```powershell
npm run dev -- --host
```

A API fica disponível localmente em `http://localhost:9090/v1/estoque`; a interface, em `http://localhost:5173`.

## Verificação e build do frontend

Na raiz do projeto:

```powershell
npm run type-check
npm run build
```

Os arquivos de produção são gerados na pasta `dist/`. O script `npm run preview` permite visualizar localmente o build.

## Configuração da API no frontend

Por padrão, o frontend usa `http://localhost:9090/v1/estoque`. Para apontar para outra API, defina a variável `VITE_API_URL` antes de iniciar ou gerar o frontend. Exemplo de arquivo `.env.local` na raiz:

```env
VITE_API_URL=http://localhost:9090/v1/estoque
```

## Estrutura do projeto

```text
src/                         Interface Vue
  components/                Componentes reutilizáveis
  services/estoqueApi.ts     Comunicação com a API
  views/                     Telas do sistema
backend/                      API Node.js/Express
  controller/                Controladores das rotas
  model/DAO/                 Acesso ao banco de dados
  model/database_config/     Configuração do MySQL
  model/database_script/     Scripts SQL
  routes/                    Rotas da API
  services/                  Regras de negócio
public/                      Imagens e arquivos estáticos
iniciar-estoque.bat          Inicialização local no Windows
```

## Documentação da API

Para consultar as rotas, parâmetros, filtros e exemplos de requisição, veja [`backend/README.md`](./backend/README.md).
