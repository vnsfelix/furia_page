/**
 * Configurações da API Backend FURIA
 */

export const config = {
  port: process.env.PORT || 3000,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  env: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'furia_super_secret_jwt_key_2026',
  dbType: process.env.DB_TYPE || 'sqlite' // 'sqlite' | 'postgres' | 'mysql' | 'memory'
};

