import { IsString, IsEmail, IsMobilePhone, IsEnum, Length, Matches, MinLength, MaxLength } from 'class-validator';

export enum GovernmentIdType {
  AADHAAR = 'aadhaar',
  PAN = 'pan',
  PASSPORT = 'passport',
}

export class StepOneSignupDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  fullName!: string;

  @IsEmail()
  primaryEmail!: string;

  @IsMobilePhone('en-IN')
  primaryPhoneNumber!: string;
}

export class StepTwoSignupDto {
  @IsEmail()
  alternativeEmail!: string;

  @IsMobilePhone('en-IN')
  alternativePhoneNumber!: string;
}

export class StepThreeSignupDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: 'Password must contain uppercase, lowercase, number and special character',
  })
  password!: string;

  @IsString()
  confirmPassword!: string;
}

export class StepFourSignupDto {
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  securityQuestion!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  securityQuestionAnswer!: string;
}

export class StepFiveSignupDto {
  @IsEnum(GovernmentIdType)
  governmentIdType!: GovernmentIdType;

  @IsString()
  @MinLength(8)
  @MaxLength(20)
  governmentIdNumber!: string;
}

export class StepSixSignupDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  secondaryApproverName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  secondaryApproverDesignation!: string;

  @IsMobilePhone('en-IN')
  secondaryApproverPhoneNumber!: string;

  @IsEmail()
  secondaryApproverEmail!: string;
}

export class CompleteSignupDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  fullName!: string;

  @IsEmail()
  primaryEmail!: string;

  @IsMobilePhone('en-IN')
  primaryPhoneNumber!: string;

  @IsEmail()
  alternativeEmail!: string;

  @IsMobilePhone('en-IN')
  alternativePhoneNumber!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(200)
  securityQuestion!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  securityQuestionAnswer!: string;

  @IsEnum(GovernmentIdType)
  governmentIdType!: GovernmentIdType;

  @IsString()
  @MinLength(8)
  @MaxLength(20)
  governmentIdNumber!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  secondaryApproverName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  secondaryApproverDesignation!: string;

  @IsMobilePhone('en-IN')
  secondaryApproverPhoneNumber!: string;

  @IsEmail()
  secondaryApproverEmail!: string;
}

export class SignupProgressDto {
  @IsString()
  currentStep!: number;

  @IsString()
  sessionId!: string;
}
