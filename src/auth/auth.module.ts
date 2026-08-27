import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { UsersModule } from 'src/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigService } from '@nestjs/config';
@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        privateKey: config.getOrThrow<string>('jwt.privateKey'),
        signOptions: {
          algorithm: 'RS256',
          expiresIn: config.getOrThrow<string>(
            'jwt.accessTtl',
          ) as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  providers: [AuthService, LocalStrategy , JwtStrategy],
  exports: [AuthService]
})
export class AuthModule {}
