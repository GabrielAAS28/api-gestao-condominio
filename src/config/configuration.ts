export default () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  upload: {
    dir: process.env.UPLOAD_DIR ?? './uploads',
    maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB ?? 10),
  },
  mail: {
    host: process.env.MAIL_HOST ?? 'smtp.gmail.com',
    port: Number(process.env.MAIL_PORT ?? 587),
    secure: process.env.MAIL_SECURE === 'true',
    user: process.env.MAIL_USER,
    password: process.env.MAIL_PASSWORD,
    fromName: process.env.MAIL_FROM_NAME ?? 'CONDIGTAL',
    fromAddress: process.env.MAIL_FROM_ADDRESS,
  },
  passwordReset: {
    ttlHours: Number(process.env.PASSWORD_RESET_TTL_HOURS ?? 2),
    baseUrl:
      process.env.PASSWORD_RESET_BASE_URL ?? 'http://localhost:3000/auth/reset-password',
  },
  leads: {
    notificationEmails: (process.env.LEAD_NOTIFICATION_EMAILS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  },
});
