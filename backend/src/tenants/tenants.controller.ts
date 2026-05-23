import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { SaveTenantConfigurationDto } from './dto/save-tenant-configuration.dto';
import { TenantsService } from './tenants.service';

@Controller('api/tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  createTenant(@Body() dto: CreateTenantDto) {
    return this.tenantsService.createTenant(dto);
  }

  @Get()
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get('next-id/:tenantType')
  generateNextId(@Param('tenantType') tenantType: string) {
    return this.tenantsService.generateNextTenantId(tenantType);
  }

  @Get(':tenantId')
  findOne(@Param('tenantId') tenantId: string) {
    return this.tenantsService.findByTenantId(tenantId);
  }

  @Put(':tenantId/configuration')
  saveConfiguration(
    @Param('tenantId') tenantId: string,
    @Body() dto: SaveTenantConfigurationDto,
  ) {
    return this.tenantsService.saveModuleConfiguration(tenantId, dto);
  }
}
