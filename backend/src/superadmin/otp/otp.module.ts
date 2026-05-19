import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthModule } from '@/superadmin/auth/auth.module';
import { DevOtpService } from './devotp.service';
import { SendgridService } from './sendgrid.service';
import { TwilioService } from './twilio.service';
import { OtpDeliveryService } from './otp-delivery.service';
import { OtpStoreService } from './otp-store.service';
import { OtpController } from './otp.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [OtpController],
  providers: [
    DevOtpService,
    SendgridService,
    TwilioService,
    OtpDeliveryService,
    OtpStoreService,
  ],
  exports: [OtpDeliveryService, OtpStoreService],
})
export class OtpModule {}
