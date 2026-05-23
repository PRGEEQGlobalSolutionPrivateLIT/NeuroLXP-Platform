import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { BulkProfileUploadController } from "./controllers/bulk-profile-upload.controller";
import { BulkProfileUploadService } from "./services/bulk-profile-upload.service";
import { BulkProfileValidationService } from "./services/bulk-profile-validation.service";
import { BulkProfileImportService } from "./services/bulk-profile-import.service";

import { BulkProfileUploadJobEntity } from "./entities/bulk-profile-upload-job.entity";
import { BulkProfileUploadRowEntity } from "./entities/bulk-profile-upload-row.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BulkProfileUploadJobEntity,
      BulkProfileUploadRowEntity,
    ]),
  ],
  controllers: [BulkProfileUploadController],
  providers: [
    BulkProfileUploadService,
    BulkProfileValidationService,
    BulkProfileImportService,
  ],
  exports: [
    BulkProfileUploadService,
    BulkProfileValidationService,
    BulkProfileImportService,
  ],
})
export class BulkProfileUploadModule {}