module.exports = {
    development: {
      client: 'mysql2',
      connection: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'db_estoque_mais',
        port: Number(process.env.DB_PORT || 3306),
       
        charset: 'utf8mb4'
      },
     
      migrations: {
        tableName: 'knex_migrations', // Nome da tabela de migrações
        directory: './db/migrations'
      },
      seeds: {
        directory: './db/seeds'
      }
    },
   
    // Você pode adicionar configurações para produção, testes, etc.
  };