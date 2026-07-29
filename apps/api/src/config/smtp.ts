export type SmtpRuntimeConfiguration = {
  enabled: boolean;
  host: string | null;
  port: number;
  secure: boolean;
  requireTls: boolean;
  user: string | null;
  pass: string | null;
  from: string | null;
  timeoutMs: number;
};

type EnvSource = NodeJS.ProcessEnv;

const PLACEHOLDER_PREFIX = 'DEFINIR_';

export function readSmtpEnv(
  source: EnvSource = process.env,
  nodeEnv = source.NODE_ENV?.trim() || 'development',
): SmtpRuntimeConfiguration {
  const host = optional(source, 'SMTP_HOST');
  const from = optional(source, 'SMTP_FROM');
  const user = optional(source, 'SMTP_USER');
  const pass = optional(source, 'SMTP_PASS');
  const portRaw = optional(source, 'SMTP_PORT');
  const secureRaw = optional(source, 'SMTP_SECURE');
  const timeoutRaw = optional(source, 'SMTP_TIMEOUT_MS');
  const requireTlsRaw = optional(source, 'SMTP_REQUIRE_TLS');

  const hasRealConnectionValue = [host, user, pass].some((value) => value && !isPlaceholder(value));
  const enabled = hasRealConnectionValue || nodeEnv === 'production';
  const normalizedHost = realValue(host);
  const normalizedFrom = realValue(from);
  const normalizedUser = realValue(user);
  const normalizedPass = realValue(pass);

  if (!enabled) {
    return {
      enabled: false,
      host: null,
      port: readPositiveInteger(portRaw, 'SMTP_PORT', 587),
      secure: readBoolean(secureRaw, 'SMTP_SECURE', false),
      requireTls: readBoolean(requireTlsRaw, 'SMTP_REQUIRE_TLS', false),
      user: null,
      pass: null,
      from: null,
      timeoutMs: readPositiveInteger(timeoutRaw, 'SMTP_TIMEOUT_MS', 15_000),
    };
  }

  const missing: string[] = [];
  if (!normalizedHost) missing.push('SMTP_HOST');
  if (!normalizedFrom) missing.push('SMTP_FROM');
  if (!normalizedUser) missing.push('SMTP_USER');
  if (!normalizedPass) missing.push('SMTP_PASS');
  if (nodeEnv === 'production' && !portRaw) missing.push('SMTP_PORT');
  if (nodeEnv === 'production' && !secureRaw) missing.push('SMTP_SECURE');
  if (missing.length > 0) {
    throw new Error(`Missing required SMTP environment variables: ${missing.join(', ')}`);
  }

  if (!isEmailAddress(extractEmailAddress(normalizedFrom!))) {
    throw new Error('Environment variable SMTP_FROM must contain a valid email address');
  }

  const port = readPositiveInteger(portRaw, 'SMTP_PORT', 587);
  const secure = readBoolean(secureRaw, 'SMTP_SECURE', false);
  const requireTls = readBoolean(requireTlsRaw, 'SMTP_REQUIRE_TLS', !secure && port === 587);

  return {
    enabled: true,
    host: normalizedHost,
    port,
    secure,
    requireTls,
    user: normalizedUser,
    pass: normalizedPass,
    from: normalizedFrom,
    timeoutMs: readPositiveInteger(timeoutRaw, 'SMTP_TIMEOUT_MS', 15_000),
  };
}

function optional(source: EnvSource, name: string): string | null {
  const value = source[name]?.trim();
  return value || null;
}

function realValue(value: string | null): string | null {
  if (!value || isPlaceholder(value)) return null;
  return value;
}

function isPlaceholder(value: string): boolean {
  return value.startsWith(PLACEHOLDER_PREFIX) || value === 'changeme';
}

function readPositiveInteger(raw: string | null, name: string, defaultValue: number): number {
  if (!raw) return defaultValue;
  if (!/^\d+$/.test(raw)) throw new Error(`Environment variable ${name} must be a positive integer`);
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0 || value > 65_535) {
    throw new Error(`Environment variable ${name} must be a positive integer`);
  }
  return value;
}

function readBoolean(raw: string | null, name: string, defaultValue: boolean): boolean {
  if (!raw) return defaultValue;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  throw new Error(`Environment variable ${name} must be either true or false`);
}

function extractEmailAddress(value: string): string {
  const match = value.trim().match(/<([^<>]+)>$/);
  return (match?.[1] ?? value).trim();
}

function isEmailAddress(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
