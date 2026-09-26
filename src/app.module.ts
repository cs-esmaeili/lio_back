import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { DatabaseModule } from './database/database.module';
import { CommonModule } from './common/common.module';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AuthorizationModule } from './authorization/authorization.module';
import { FileManagerModule } from './file-manager/file-manager.module';
import { SiteSettingModule } from './site-setting/site-setting.module';
import { PageSectionModule } from './page-section/page-section.module';
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
import { CartModule } from './cart/cart.module';
import { CheckoutModule } from './checkout/checkout.module';
import { AddressModule } from './address/address.module';
import { LocationModule } from './location/location.module';
import { SmsModule } from './sms/sms.module';
import { PaymentModule } from './payment/payment.module';
import { LoggerModule } from './logger/logger.module';
import { LogViewerModule } from './log-viewer/log-viewer.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { RequestLoggingInterceptor } from './logger/interceptors/request-logging.interceptor';
import { RequestContextMiddleware } from './logger/context/request-context.middleware';
import { RequestUserContextInterceptor } from './logger/context/request-user-context.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public', 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: { index: false },
    }),
    DatabaseModule,
    CommonModule,
    AuthModule,
    UsersModule,
    AuthorizationModule,
    FileManagerModule,
    SiteSettingModule,
    PageSectionModule,
    CategoryModule,
    ProductModule,
    CartModule,
    CheckoutModule,
    AddressModule,
    LocationModule,
    SmsModule,
    PaymentModule,
    LoggerModule,
    LogViewerModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: RequestLoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: RequestUserContextInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
