import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { SuperadminModule } from './superadmin/superadmin.module';
import { PlatformAdminModule } from './platform-admin/platform-admin.module';
import { InstitutionAdminModule } from './institution-admin/institution-admin.module';
import { MembersModule } from './members/members.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    SuperadminModule,
    PlatformAdminModule,
    InstitutionAdminModule,
    MembersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
