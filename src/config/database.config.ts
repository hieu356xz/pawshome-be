import { DataSource, DataSourceOptions } from 'typeorm';
import { SeederOptions } from 'typeorm-extension';
import { config } from 'dotenv';

config();

const databaseConfig = () => ({
  type: 'postgres' as DataSourceOptions['type'],
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'pawshome',
  entities: [__dirname + '/../**/entities/*.entity.{ts,js}'],
  migrations: [__dirname + '/../migrations/*.{ts,js}'],
});

const seederConfig: SeederOptions = {
  seeds: ['src/seeds/**/*.{ts,js}'],
  factories: ['src/factories/**/*.{ts,js}'],
};

// for TypeORM CLI migrations
export const AppDataSource = new DataSource({
  ...(databaseConfig() as DataSourceOptions),
  ...seederConfig,
});

export default databaseConfig;
