import assert from 'node:assert/strict';
import { AddressInfo, createServer, Socket } from 'node:net';
import { ConfigService } from '@nestjs/config';
import { SmtpEmailTransport } from '../modules/messaging/smtp-email.transport';

async function main(): Promise<void> {
  const commands: string[] = [];
  let rawMessage = '';

  const server = createServer((socket) => handleClient(socket, commands, (raw) => {
    rawMessage = raw;
  }));
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  try {
    const address = server.address() as AddressInfo;
    const config = new ConfigService({
      smtp: {
        enabled: true,
        host: '127.0.0.1',
        port: address.port,
        secure: false,
        requireTls: false,
        user: null,
        pass: null,
        from: 'AurelIA <no-reply-aurelia@kabeli.cl>',
        timeoutMs: 5000,
      },
    });
    const transport = new SmtpEmailTransport(config);
    const result = await transport.send({
      to: [{ email: 'responsable@example.com', name: 'Patricia Soto' }],
      subject: 'AurelIA — Hallazgo asignado',
      text: 'Se asignó una observación.',
      html: '<strong>Se asignó una observación.</strong>',
    });

    assert.equal(result.provider, 'smtp');
    assert.deepEqual(result.accepted, ['responsable@example.com']);
    assert.equal(result.rejected.length, 0);
    assert.match(result.messageId ?? '', /^<.+@kabeli\.cl>$/);
    assert.ok(commands.some((command) => command.startsWith('EHLO ')));
    assert.ok(!commands.some((command) => command.startsWith('AUTH ')));
    assert.ok(commands.includes('MAIL FROM:<no-reply-aurelia@kabeli.cl>'));
    assert.ok(commands.includes('RCPT TO:<responsable@example.com>'));
    assert.match(rawMessage, /Content-Type: multipart\/alternative/);
    assert.match(rawMessage, /Message-ID: <.+@kabeli\.cl>/);

    const tlsRequired = new SmtpEmailTransport(new ConfigService({
      smtp: {
        enabled: true,
        host: '127.0.0.1',
        port: address.port,
        secure: false,
        requireTls: true,
        user: null,
        pass: null,
        from: 'AurelIA <no-reply-aurelia@kabeli.cl>',
        timeoutMs: 5000,
      },
    }));

    await assert.rejects(() => tlsRequired.send({
      to: [{ email: 'responsable@example.com' }],
      subject: 'TLS requerido',
      text: 'Prueba',
      html: '<p>Prueba</p>',
    }), /did not advertise STARTTLS/);

    console.log('SMTP email transport smoke test passed.');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

function handleClient(
  socket: Socket,
  commands: string[],
  onMessage: (message: string) => void,
): void {
  let buffer = '';
  let dataMode = false;
  socket.write('220 smtp.test ESMTP ready\r\n');

  socket.on('data', (chunk) => {
    buffer += chunk.toString('utf8');

    if (dataMode) {
      const terminator = buffer.indexOf('\r\n.\r\n');
      if (terminator < 0) return;
      onMessage(buffer.slice(0, terminator));
      buffer = buffer.slice(terminator + 5);
      dataMode = false;
      socket.write('250 2.0.0 queued\r\n');
    }

    let lineBreak = buffer.indexOf('\r\n');
    while (!dataMode && lineBreak >= 0) {
      const command = buffer.slice(0, lineBreak);
      buffer = buffer.slice(lineBreak + 2);
      if (command) commands.push(command);

      if (command.startsWith('EHLO ')) {
        socket.write('250 smtp.test\r\n');
      } else if (command.startsWith('MAIL FROM:')) {
        socket.write('250 2.1.0 sender ok\r\n');
      } else if (command.startsWith('RCPT TO:')) {
        socket.write('250 2.1.5 recipient ok\r\n');
      } else if (command === 'DATA') {
        dataMode = true;
        socket.write('354 End data with <CR><LF>.<CR><LF>\r\n');
      } else if (command === 'QUIT') {
        socket.write('221 2.0.0 bye\r\n');
        socket.end();
      } else {
        socket.write('500 5.5.2 unsupported command\r\n');
      }

      lineBreak = buffer.indexOf('\r\n');
    }
  });
}

void main();
