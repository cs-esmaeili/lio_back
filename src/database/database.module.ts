import { Global, Module } from '@nestjs/common';
import { DATABASE } from './database.constants';
import { DatabaseService } from './database.service';

@Global()
@Module({
  providers: [
    DatabaseService,
    {
      provide: DATABASE,
      useFactory: (database: DatabaseService) => database.db,
      inject: [DatabaseService],
    },
  ],
  exports: [DatabaseService, DATABASE],
})
export class DatabaseModule {}
