import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AuthorizationModule } from './authorization/authorization.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public', 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: { index: false },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    AuthorizationModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
