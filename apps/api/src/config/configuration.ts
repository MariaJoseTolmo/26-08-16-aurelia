import { readApiEnv } from './env';
import { readSmtpEnv } from './smtp';

export default () => {
  const env = readApiEnv();

  return {
    port: env.port,
    database: env.database,
    cors: env.cors,
    security: env.security,
    auth: env.auth,
    ai: env.ai,
    swagger: env.swagger,
    smtp: readSmtpEnv(),
  };
};
