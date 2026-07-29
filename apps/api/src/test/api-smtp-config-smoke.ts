import assert from 'node:assert/strict';
import { readSmtpEnv } from '../config/smtp';

function main(): void {
  const disabled = readSmtpEnv({
    NODE_ENV: 'development',
    SMTP_HOST: 'DEFINIR_INFRA_SMTP_HOST',
    SMTP_PORT: '587',
    SMTP_SECURE: 'false',
    SMTP_REQUIRE_TLS: 'true',
    SMTP_USER: 'DEFINIR_INFRA_KEYVAULT_SECRET_SMTP_USER',
    SMTP_PASS: 'DEFINIR_INFRA_KEYVAULT_SECRET_SMTP_PASS',
    SMTP_FROM: 'AurelIA <no-reply-aurelia@kabeli.cl>',
  });
  assert.equal(disabled.enabled, false);

  const disabledWithoutHost = readSmtpEnv({
    NODE_ENV: 'production',
    SMTP_HOST: '',
    SMTP_PORT: '587',
    SMTP_SECURE: 'false',
    SMTP_USER: 'aurelia-user-from-key-vault',
    SMTP_PASS: 'secret-from-key-vault',
    SMTP_FROM: 'no-reply-aurelia@kabeli.cl',
  });
  assert.equal(disabledWithoutHost.enabled, false);
  assert.equal(disabledWithoutHost.host, null);
  assert.equal(disabledWithoutHost.user, null);
  assert.equal(disabledWithoutHost.pass, null);
  assert.equal(disabledWithoutHost.from, null);

  assert.throws(() => readSmtpEnv({
    NODE_ENV: 'production',
    SMTP_HOST: 'smtp.example.com',
    SMTP_PORT: '587',
    SMTP_SECURE: 'false',
    SMTP_FROM: 'AurelIA <no-reply@example.com>',
  }), /SMTP_USER, SMTP_PASS/);

  assert.throws(() => readSmtpEnv({
    NODE_ENV: 'production',
    SMTP_HOST: 'smtp.example.com',
    SMTP_PORT: 'not-a-port',
    SMTP_SECURE: 'false',
    SMTP_USER: 'aurelia-user',
    SMTP_PASS: 'secret-from-key-vault',
    SMTP_FROM: 'AurelIA <no-reply@example.com>',
  }), /SMTP_PORT must be a positive integer/);

  const startTls = readSmtpEnv({
    NODE_ENV: 'production',
    SMTP_HOST: 'smtp.example.com',
    SMTP_PORT: '587',
    SMTP_SECURE: 'false',
    SMTP_USER: 'aurelia-user',
    SMTP_PASS: 'secret-from-key-vault',
    SMTP_FROM: 'AurelIA <no-reply@example.com>',
    SMTP_TIMEOUT_MS: '15000',
  });
  assert.equal(startTls.enabled, true);
  assert.equal(startTls.secure, false);
  assert.equal(startTls.requireTls, true);
  assert.equal(startTls.port, 587);

  const implicitTls = readSmtpEnv({
    NODE_ENV: 'production',
    SMTP_HOST: 'smtp.example.com',
    SMTP_PORT: '465',
    SMTP_SECURE: 'true',
    SMTP_REQUIRE_TLS: 'false',
    SMTP_USER: 'aurelia-user',
    SMTP_PASS: 'secret-from-key-vault',
    SMTP_FROM: 'no-reply@example.com',
  });
  assert.equal(implicitTls.secure, true);
  assert.equal(implicitTls.requireTls, false);

  console.log('SMTP configuration smoke test passed.');
}

main();
