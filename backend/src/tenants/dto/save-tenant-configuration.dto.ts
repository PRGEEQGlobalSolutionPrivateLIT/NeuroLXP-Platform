import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class SaveTenantConfigurationDto {
  @IsString()
  @IsNotEmpty()
  tenantName!: string;

  @IsString()
  @IsNotEmpty()
  tenantType!: string;

  @IsArray()
  @IsString({ each: true })
  profilingTenantTypes!: string[];

  @IsArray()
  @IsString({ each: true })
  selectedModules!: string[];
}
