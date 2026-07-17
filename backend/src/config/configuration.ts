import { UPLOADS_DIR } from '../recursos/uploads-dir.util';

export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  uploadsDir: UPLOADS_DIR,
  database: {
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
    user: process.env.POSTGRES_USER ?? 'coaching',
    password: process.env.POSTGRES_PASSWORD ?? 'coaching',
    name: process.env.POSTGRES_DB ?? 'coaching',
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
  },
  bcryptRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10),
  seed: {
    coachEmail: process.env.SEED_COACH_EMAIL,
    coachPassword: process.env.SEED_COACH_PASSWORD,
  },
});
