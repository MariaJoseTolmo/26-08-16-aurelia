import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { hostname } from 'node:os';
import { connect as connectTcp, Socket } from 'node:net';
import { connect as connectTls, TLSSocket } from 'node:tls';
import { readSmtpEnv, SmtpRuntimeConfiguration } from '../../config/smtp';
import {
  EmailDeliveryResult,
  EmailRecipient,
  EmailTransport,
  OutboundEmail,
} from './messaging.types';

type SmtpSocket = Socket | TLSSocket;

type SmtpResponse = {
  code: number;
  lines: string[];
};

type SmtpConfiguration = {
  host: string;
  port: number;
  secure: boolean;
  requireTls: boolean;
  user: string | null;
  pass: string | null;
  from: string;
  timeoutMs: number;
};

type PendingResponse = {
  resolve: (response: SmtpResponse) => void;
  reject: (error: Error) => void;
  timer: NodeJS.Timeout;
};

class SmtpSession {
  private buffer = '';
  private currentCode: number | null = null;
  private currentLines: string[] = [];
  private readonly queuedResponses: SmtpResponse[] = [];
  private readonly pendingResponses: PendingResponse[] = [];
  private closed = false;

  constructor(
    private socket: SmtpSocket,
    private readonly timeoutMs: number,
  ) {
    this.bindSocket(socket);
  }

  async waitForResponse(): Promise<SmtpResponse> {
    const queued = this.queuedResponses.shift();
    if (queued) return queued;
    if (this.closed) throw new Error('SMTP connection closed before receiving a response');

    return new Promise<SmtpResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        const index = this.pendingResponses.findIndex((pending) => pending.timer === timer);
        if (index >= 0) this.pendingResponses.splice(index, 1);
        reject(new Error(`SMTP response timed out after ${this.timeoutMs} ms`));
      }, this.timeoutMs);
      this.pendingResponses.push({ resolve, reject, timer });
    });
  }

  async command(command: string): Promise<SmtpResponse> {
    await this.write(`${command}\r\n`);
    return this.waitForResponse();
  }

  async sendData(message: string): Promise<SmtpResponse> {
    const normalized = message.replace(/\r?\n/g, '\r\n');
    const dotStuffed = normalized
      .split('\r\n')
      .map((line) => (line.startsWith('.') ? `.${line}` : line))
      .join('\r\n');
    await this.write(`${dotStuffed}\r\n.\r\n`);
    return this.waitForResponse();
  }

  async upgradeToTls(servername: string): Promise<void> {
    const previousSocket = this.socket;
    this.unbindSocket(previousSocket);
    this.buffer = '';
    this.currentCode = null;
    this.currentLines = [];

    const upgraded = connectTls({
      socket: previousSocket as Socket,
      servername,
      rejectUnauthorized: true,
    });

    await new Promise<void>((resolve, reject) => {
      const onError = (error: Error) => reject(error);
      upgraded.once('error', onError);
      upgraded.once('secureConnect', () => {
        upgraded.off('error', onError);
        resolve();
      });
    });

    this.socket = upgraded;
    this.bindSocket(upgraded);
  }

  async quit(): Promise<void> {
    if (this.closed) return;
    try {
      await this.command('QUIT');
    } catch {
      // Closing a completed SMTP transaction is best effort.
    }
  }

  destroy(): void {
    if (!this.socket.destroyed) this.socket.destroy();
    this.closed = true;
    this.rejectPending(new Error('SMTP connection destroyed'));
  }

  private async write(value: string): Promise<void> {
    if (this.closed || this.socket.destroyed) throw new Error('SMTP connection is not writable');
    await new Promise<void>((resolve, reject) => {
      this.socket.write(value, 'utf8', (error?: Error | null) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  private readonly onData = (chunk: Buffer): void => {
    this.buffer += chunk.toString('utf8');
    let lineBreak = this.buffer.indexOf('\n');
    while (lineBreak >= 0) {
      const line = this.buffer.slice(0, lineBreak).replace(/\r$/, '');
      this.buffer = this.buffer.slice(lineBreak + 1);
      this.consumeLine(line);
      lineBreak = this.buffer.indexOf('\n');
    }
  };

  private readonly onError = (error: Error): void => {
    this.rejectPending(error);
  };

  private readonly onClose = (): void => {
    this.closed = true;
    this.rejectPending(new Error('SMTP connection closed unexpectedly'));
  };

  private consumeLine(line: string): void {
    const match = line.match(/^(\d{3})([ -])(.*)$/);
    if (!match) {
      if (this.currentCode !== null) this.currentLines.push(line);
      return;
    }

    const code = Number.parseInt(match[1], 10);
    const separator = match[2];
    const message = match[3] ?? '';
    if (this.currentCode === null) this.currentCode = code;
    this.currentLines.push(message);

    if (separator === ' ') {
      const response = { code: this.currentCode, lines: [...this.currentLines] };
      this.currentCode = null;
      this.currentLines = [];
      this.emitResponse(response);
    }
  }

  private emitResponse(response: SmtpResponse): void {
    const pending = this.pendingResponses.shift();
    if (!pending) {
      this.queuedResponses.push(response);
      return;
    }
    clearTimeout(pending.timer);
    pending.resolve(response);
  }

  private rejectPending(error: Error): void {
    while (this.pendingResponses.length > 0) {
      const pending = this.pendingResponses.shift();
      if (!pending) continue;
      clearTimeout(pending.timer);
      pending.reject(error);
    }
  }

  private bindSocket(socket: SmtpSocket): void {
    socket.setTimeout(this.timeoutMs, () => {
      this.rejectPending(new Error(`SMTP socket timed out after ${this.timeoutMs} ms`));
      socket.destroy();
    });
    socket.on('data', this.onData);
    socket.on('error', this.onError);
    socket.on('close', this.onClose);
  }

  private unbindSocket(socket: SmtpSocket): void {
    socket.off('data', this.onData);
    socket.off('error', this.onError);
    socket.off('close', this.onClose);
    socket.setTimeout(0);
  }
}

@Injectable()
export class SmtpEmailTransport implements EmailTransport {
  private readonly logger = new Logger(SmtpEmailTransport.name);

  constructor(private readonly config: ConfigService) {}

  async send(message: OutboundEmail): Promise<EmailDeliveryResult> {
    const smtp = this.readConfiguration();
    const socket = smtp.secure
      ? connectTls({ host: smtp.host, port: smtp.port, servername: smtp.host, rejectUnauthorized: true })
      : connectTcp({ host: smtp.host, port: smtp.port });
    const session = new SmtpSession(socket, smtp.timeoutMs);
    let tlsActive = smtp.secure;

    try {
      await this.waitForConnection(socket, smtp.secure);
      this.expect(await session.waitForResponse(), [220], 'SMTP greeting');

      let capabilities = await session.command(`EHLO ${hostname() || 'aurelia.local'}`);
      this.expect(capabilities, [250], 'EHLO');

      if (!smtp.secure) {
        if (this.supportsCapability(capabilities, 'STARTTLS')) {
          this.expect(await session.command('STARTTLS'), [220], 'STARTTLS');
          await session.upgradeToTls(smtp.host);
          tlsActive = true;
          capabilities = await session.command(`EHLO ${hostname() || 'aurelia.local'}`);
          this.expect(capabilities, [250], 'EHLO after STARTTLS');
        } else if (smtp.requireTls) {
          throw new Error('SMTP server did not advertise STARTTLS');
        }
      }

      if (smtp.user && smtp.pass) {
        if (!tlsActive) throw new Error('SMTP authentication requires a TLS-protected connection');
        await this.authenticate(session, capabilities, smtp.user, smtp.pass);
      }

      const envelopeFrom = this.extractEmailAddress(smtp.from);
      this.expect(await session.command(`MAIL FROM:<${envelopeFrom}>`), [250], 'MAIL FROM');

      const recipients = this.uniqueRecipients(message);
      const accepted: string[] = [];
      const rejected: string[] = [];
      for (const recipient of recipients) {
        const response = await session.command(`RCPT TO:<${recipient.email}>`);
        if (response.code === 250 || response.code === 251) accepted.push(recipient.email);
        else rejected.push(recipient.email);
      }
      if (accepted.length === 0) {
        throw new Error(`SMTP rejected all recipients: ${rejected.join(', ') || 'no recipients'}`);
      }

      this.expect(await session.command('DATA'), [354], 'DATA');
      const mime = this.buildMimeMessage(message, smtp.from);
      this.expect(await session.sendData(mime.raw), [250], 'message body');
      await session.quit();

      return {
        provider: 'smtp',
        messageId: mime.messageId,
        accepted,
        rejected,
      };
    } catch (error) {
      const detail = this.redactError(error, smtp);
      this.logger.error(`SMTP delivery failed: ${detail}`);
      throw error;
    } finally {
      session.destroy();
    }
  }

  private readConfiguration(): SmtpConfiguration {
    const namespaced = this.config.get<SmtpRuntimeConfiguration>('smtp');
    const runtime = namespaced ?? readSmtpEnv({
      NODE_ENV: 'development',
      SMTP_HOST: this.config.get<string>('SMTP_HOST'),
      SMTP_PORT: this.config.get<string>('SMTP_PORT'),
      SMTP_SECURE: this.config.get<string>('SMTP_SECURE'),
      SMTP_REQUIRE_TLS: this.config.get<string>('SMTP_REQUIRE_TLS'),
      SMTP_USER: this.config.get<string>('SMTP_USER'),
      SMTP_PASS: this.config.get<string>('SMTP_PASS'),
      SMTP_FROM: this.config.get<string>('SMTP_FROM'),
      SMTP_TIMEOUT_MS: this.config.get<string>('SMTP_TIMEOUT_MS'),
    });

    if (!runtime.enabled || !runtime.host || !runtime.from) {
      throw new ServiceUnavailableException('SMTP is not configured. Define SMTP_HOST and SMTP_FROM.');
    }

    return {
      host: runtime.host,
      port: runtime.port,
      secure: runtime.secure,
      requireTls: runtime.requireTls,
      user: runtime.user,
      pass: runtime.pass,
      from: runtime.from,
      timeoutMs: runtime.timeoutMs,
    };
  }

  private async authenticate(
    session: SmtpSession,
    capabilities: SmtpResponse,
    user: string,
    pass: string,
  ): Promise<void> {
    const capabilityText = capabilities.lines.join(' ').toUpperCase();
    if (capabilityText.includes('AUTH PLAIN')) {
      const token = Buffer.from(`\u0000${user}\u0000${pass}`, 'utf8').toString('base64');
      this.expect(await session.command(`AUTH PLAIN ${token}`), [235], 'AUTH PLAIN');
      return;
    }

    if (capabilityText.includes('AUTH LOGIN')) {
      this.expect(await session.command('AUTH LOGIN'), [334], 'AUTH LOGIN');
      this.expect(await session.command(Buffer.from(user, 'utf8').toString('base64')), [334], 'SMTP username');
      this.expect(await session.command(Buffer.from(pass, 'utf8').toString('base64')), [235], 'SMTP password');
      return;
    }

    throw new Error('SMTP server does not advertise AUTH PLAIN or AUTH LOGIN');
  }

  private buildMimeMessage(message: OutboundEmail, from: string): { messageId: string; raw: string } {
    const boundary = `aurelia-${randomUUID()}`;
    const fromAddress = this.extractEmailAddress(from);
    const domain = fromAddress.split('@')[1] ?? 'aurelia.local';
    const messageId = `<${randomUUID()}@${domain}>`;
    const headers = [
      `From: ${this.formatFromHeader(from)}`,
      `To: ${message.to.map((recipient) => this.formatRecipient(recipient)).join(', ')}`,
      ...(message.cc?.length ? [`Cc: ${message.cc.map((recipient) => this.formatRecipient(recipient)).join(', ')}`] : []),
      `Subject: ${this.encodeHeader(message.subject)}`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: ${messageId}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ];

    const raw = [
      ...headers,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      this.base64Lines(message.text),
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      this.base64Lines(message.html),
      `--${boundary}--`,
      '',
    ].join('\r\n');

    return { messageId, raw };
  }

  private uniqueRecipients(message: OutboundEmail): EmailRecipient[] {
    const byEmail = new Map<string, EmailRecipient>();
    [...message.to, ...(message.cc ?? []), ...(message.bcc ?? [])].forEach((recipient) => {
      const email = recipient.email.trim();
      if (!email) return;
      const key = email.toLowerCase();
      if (!byEmail.has(key)) byEmail.set(key, { ...recipient, email });
    });
    return Array.from(byEmail.values());
  }

  private formatRecipient(recipient: EmailRecipient): string {
    const email = this.sanitizeHeader(recipient.email.trim());
    const name = recipient.name?.trim();
    return name ? `${this.encodeHeader(name)} <${email}>` : email;
  }

  private formatFromHeader(from: string): string {
    const normalized = this.sanitizeHeader(from.trim());
    const match = normalized.match(/^(.+?)\s*<([^<>]+)>$/);
    if (!match) return normalized;
    const name = match[1]?.trim();
    const email = match[2]?.trim();
    return name && email ? `${this.encodeHeader(name)} <${email}>` : normalized;
  }

  private extractEmailAddress(value: string): string {
    const normalized = this.sanitizeHeader(value.trim());
    const match = normalized.match(/<([^<>]+)>$/);
    const email = (match?.[1] ?? normalized).trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ServiceUnavailableException('SMTP_FROM must contain a valid email address.');
    }
    return email;
  }

  private base64Lines(value: string): string {
    return Buffer.from(value, 'utf8').toString('base64').match(/.{1,76}/g)?.join('\r\n') ?? '';
  }

  private encodeHeader(value: string): string {
    const sanitized = this.sanitizeHeader(value);
    if (/^[\x20-\x7E]*$/.test(sanitized)) return sanitized;
    return `=?UTF-8?B?${Buffer.from(sanitized, 'utf8').toString('base64')}?=`;
  }

  private sanitizeHeader(value: string): string {
    return value.replace(/[\r\n]+/g, ' ').trim();
  }

  private expect(response: SmtpResponse, acceptedCodes: number[], phase: string): void {
    if (acceptedCodes.includes(response.code)) return;
    throw new Error(`${phase} failed with SMTP ${response.code}: ${response.lines.join(' ')}`);
  }

  private supportsCapability(response: SmtpResponse, capability: string): boolean {
    const expected = capability.toUpperCase();
    return response.lines.some((line) => line.toUpperCase().split(/\s+/).includes(expected));
  }

  private waitForConnection(socket: SmtpSocket, secure: boolean): Promise<void> {
    if (secure && socket instanceof TLSSocket && socket.authorized) return Promise.resolve();
    if (!secure && socket.readyState === 'open') return Promise.resolve();

    return new Promise<void>((resolve, reject) => {
      const readyEvent = secure ? 'secureConnect' : 'connect';
      const onError = (error: Error) => reject(error);
      socket.once('error', onError);
      socket.once(readyEvent, () => {
        socket.off('error', onError);
        resolve();
      });
    });
  }

  private redactError(error: unknown, smtp: SmtpConfiguration): string {
    let detail = error instanceof Error ? error.message : String(error);
    const secrets = [
      smtp.user,
      smtp.pass,
      smtp.user ? Buffer.from(smtp.user, 'utf8').toString('base64') : null,
      smtp.pass ? Buffer.from(smtp.pass, 'utf8').toString('base64') : null,
      smtp.user && smtp.pass
        ? Buffer.from(`\u0000${smtp.user}\u0000${smtp.pass}`, 'utf8').toString('base64')
        : null,
    ].filter((value): value is string => Boolean(value));
    for (const secret of secrets) detail = detail.split(secret).join('[REDACTED]');
    return detail;
  }
}
