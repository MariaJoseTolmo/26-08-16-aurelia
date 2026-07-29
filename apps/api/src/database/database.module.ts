import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.name'),
        autoLoadEntities: true,
        // El esquema se gestiona con migraciones de TypeORM.
        // synchronize solo se habilita explícitamente vía DB_SYNCHRONIZE=true (desarrollo).
        synchronize: config.get<boolean>('database.synchronize'),
        ssl: config.get<boolean>('database.ssl') ? { rejectUnauthorized: false } : false,
        // Carga sólo migraciones versionadas con prefijo timestamp y evita ejecutar
        // artefactos obsoletos como generated-auto-schema-sync.js que puedan quedar
        // en el filesystem después de un despliegue por superposición.
        migrations: ['dist/database/migrations/[0-9]*-*.js'],
      }),
    }),
  ],
})
export class DatabaseModule {}
