type EnvSource = NodeJS.ProcessEnv;

type ApiEnv = {
  port: number;
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    name: string;
    synchronize: boolean;
    ssl: boolean;
  };
  cors: {
    origins: string[];
  };
  security: {
    tokenKey: string;
    tokenTtlSeconds: number;
    sessionTtlSeconds: number;
    rateLimitStore: 'memory' | 'database';
    rateLimitWindowMs: number;
    rateLimitMax: number;
  };
  auth: {
    loginPassword: string;
    demoUserPassword: string;
  };
  ai: {
    anthropicApiKey: string | null;
  };
  swagger: {
    enabled: boolean;
    path: string;
  };
};

function readRequiredString(source: EnvSource, name: string): string {
  const value = source[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}

function readOptionalString(source: EnvSource, name: string): string | null {
  const value = source[name]?.trim();
  return value ? value : null;
}

function readNumber(source: EnvSource, name: string): number {
  const raw = readRequiredString(source, name);
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value)) throw new Error(`Environment variable ${name} must be a valid integer`);
  return value;
}

function readPositiveNumber(source: EnvSource, name: string): number {
  const value = readNumber(source, name);
  if (value <= 0) throw new Error(`Environment variable ${name} must be greater than zero`);
  return value;
}

function readBoolean(source: EnvSource, name: string): boolean {
  const raw = readRequiredString(source, name);
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  throw new Error(`Environment variable ${name} must be either true or false`);
}

function readOptionalBoolean(source: EnvSource, name: string, defaultValue: boolean): boolean {
  const raw = source[name]?.trim();
  if (!raw) return defaultValue;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  throw new Error(`Environment variable ${name} must be either true or false`);
}

function readCsv(source: EnvSource, name: string): string[] {
  const values = readRequiredString(source, name)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (values.length === 0) throw new Error(`Environment variable ${name} must contain at least one value`);
  return values;
}

function readRateLimitStore(source: EnvSource): 'memory' | 'database' {
  const value = readRequiredString(source, 'API_RATE_LIMIT_STORE');
  if (value === 'memory' || value === 'database') return value;
  throw new Error('Environment variable API_RATE_LIMIT_STORE must be either memory or database');
}

function readSwaggerPath(source: EnvSource): string {
  const value = readOptionalString(source, 'SWAGGER_PATH') ?? 'docs';
  const normalized = value.replace(/^\/+|\/+$/g, '');
  if (!normalized || !/^[a-zA-Z0-9/_-]+$/.test(normalized)) {
    throw new Error('Environment variable SWAGGER_PATH must be a valid relative URL path');
  }
  return normalized;
}

export function readApiEnv(source: EnvSource = process.env): ApiEnv {
  const tokenKey = readRequiredString(source, 'API_TOKEN_KEY');
  if (tokenKey.length < 32) throw new Error('Environment variable API_TOKEN_KEY must be at least 32 characters');

  return {
    port: readPositiveNumber(source, 'PORT'),
    database: {
      host: readRequiredString(source, 'DB_HOST'),
      port: readPositiveNumber(source, 'DB_PORT'),
      username: readRequiredString(source, 'DB_USERNAME'),
      password: readRequiredString(source, 'DB_PASSWORD'),
      name: readRequiredString(source, 'DB_NAME'),
      synchronize: readBoolean(source, 'DB_SYNCHRONIZE'),
      ssl: readOptionalBoolean(source, 'DB_SSL', false),
    },
    cors: {
      origins: readCsv(source, 'CORS_ORIGINS'),
    },
    security: {
      tokenKey,
      tokenTtlSeconds: readPositiveNumber(source, 'API_TOKEN_TTL_SECONDS'),
      sessionTtlSeconds: readPositiveNumber(source, 'API_SESSION_TTL_SECONDS'),
      rateLimitStore: readRateLimitStore(source),
      rateLimitWindowMs: readPositiveNumber(source, 'API_RATE_LIMIT_WINDOW_MS'),
      rateLimitMax: readPositiveNumber(source, 'API_RATE_LIMIT_MAX'),
    },
    auth: {
      loginPassword: readRequiredString(source, 'API_LOGIN_PASSWORD'),
      demoUserPassword: readRequiredString(source, 'AURELIA_DEMO_USER_PASSWORD'),
    },
    ai: {
      anthropicApiKey: readOptionalString(source, 'ANTHROPIC_API_KEY'),
    },
    swagger: {
      enabled: readOptionalBoolean(source, 'SWAGGER_ENABLED', source.NODE_ENV !== 'production'),
      path: readSwaggerPath(source),
    },
  };
}
