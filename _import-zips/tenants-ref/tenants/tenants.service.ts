import { ConflictException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TenantEntity } from "./entities/tenant.entity";
import { CreateTenantDto } from "./dto/create-tenant.dto";

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
  ) {}

  async createTenant(dto: CreateTenantDto) {
    const existingTenant = await this.tenantRepository.findOne({
      where: { tenantId: dto.tenantId },
    });

    if (existingTenant) {
      throw new ConflictException("Tenant ID already exists");
    }

    const tenant = this.tenantRepository.create(dto);
    return this.tenantRepository.save(tenant);
  }

  async findAll() {
    return this.tenantRepository.find({
      order: { createdAt: "DESC" },
    });
  }
}