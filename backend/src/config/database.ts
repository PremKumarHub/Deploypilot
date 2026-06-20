import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgresql://admin:password@localhost:5432/deployai',
  {
    logging: console.log,
    dialect: 'postgres',
  }
);

export default sequelize;
