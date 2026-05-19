import { IsString, IsEmail, IsMobilePhone, IsOptional, Length } from 'class-validator';

export class PrimarySigninDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsMobilePhone('en-IN')
  phoneNumber?: string;

  @IsString()
  password!: string;
}

export class SelectOtpMethodDto {
  @IsString()
  method!: 'email' | 'phone';
}

export class VerifyOtpDto {
  @IsString()
  @Length(6, 6)
  otp!: string;
}

export class VerifyAuthenticatorDto {
  @IsString()
  @Length(6, 6)
  code!: string;
}

export class VerifyRecoveryCodeDto {
  @IsString()
  recoveryCode!: string;
}

export class VerifyBackupCodeDto {
  @IsString()
  @Length(8, 8)
  backupCode!: string;
}

export class VerifySecurityQuestionDto {
  @IsString()
  answer!: string;
}

export class VerifyGovernmentIdDto {
  @IsString()
  governmentIdNumber!: string;
}

export class RequestApprovalDto {
  // No input needed - system generates approval code
}

export class VerifyApprovalCodeDto {
  @IsString()
  approvalCode!: string;
}
