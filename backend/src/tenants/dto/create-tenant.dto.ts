import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTenantDto {
  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsString()
  @IsNotEmpty()
  tenantName!: string;

  @IsString()
  @IsNotEmpty()
  tenantType!: string;

  @IsString()
  @IsNotEmpty()
  country!: string;

  @IsString()
  @IsNotEmpty()
  state!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsNotEmpty()
  contactPersonName!: string;

  @IsEmail()
  contactEmail!: string;

  @IsString()
  @IsNotEmpty()
  contactMobile!: string;

  @IsOptional()
  @IsString()
  alternateContactPersonName?: string;

  @IsOptional()
  @IsEmail()
  alternateContactEmail?: string;

  @IsOptional()
  @IsString()
  alternateContactMobile?: string;

  @IsString()
  @IsNotEmpty()
  platformPurpose!: string;

  @IsString()
  @IsNotEmpty()
  programmeCategory!: string;

  @IsString()
  @IsNotEmpty()
  programmesOffered!: string;

  @IsString()
  @IsNotEmpty()
  expectedUsers!: string;

  @IsString()
  @IsNotEmpty()
  subscriptionPlan!: string;

  @IsString()
  @IsNotEmpty()
  status!: string;

  @IsOptional()
  @IsString()
  createdByType?: string;

  @IsOptional()
  @IsString()
  createdById?: string;
}
