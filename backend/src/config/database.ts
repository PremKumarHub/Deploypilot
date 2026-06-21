import { Sequelize } from 'sequelize';

// If DATABASE_URL is provided, use it (Postgres). Otherwise fall back to
// an in-memory SQLite database for local testing without Docker.
let sequelize: Sequelize;
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    logging: console.log,
    dialect: 'postgres',
  });
} else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: console.log,
  });
}

export default sequelize;
