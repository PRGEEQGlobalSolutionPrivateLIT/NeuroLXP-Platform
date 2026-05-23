import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ProfileController } from "./controllers/profile.controller";
import { ProfileTemplateController } from "./controllers/profile-template.controller";
import { ProfileDocumentController } from "./controllers/profile-document.controller";
import { ProfileConsentController } from "./controllers/profile-consent.controller";

import { ProfileService } from "./services/profile.service";
import { ProfileTemplateService } from "./services/profile-template.service";
import { ProfileCompletionService } from "./services/profile-completion.service";
import { ProfileDocumentService } from "./services/profile-document.service";
import { ProfileConsentService } from "./services/profile-consent.service";

import { UserProfileEntity } from "./entities/user-profile.entity";
import { ProfileFieldValueEntity } from "./entities/profile-field-value.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserProfileEntity,
      ProfileFieldValueEntity,
    ]),
  ],

  controllers: [
    ProfileController,
    ProfileTemplateController,
    ProfileDocumentController,
    ProfileConsentController,
  ],

  providers: [
    ProfileService,
    ProfileTemplateService,
    ProfileCompletionService,
    ProfileDocumentService,
    ProfileConsentService,
  ],

  exports: [
    ProfileService,
    ProfileTemplateService,
    ProfileCompletionService,
    ProfileDocumentService,
    ProfileConsentService,
    TypeOrmModule,
  ],
})
export class ProfilingModule {}