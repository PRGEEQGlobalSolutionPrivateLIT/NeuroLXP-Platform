import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("tenants")
export class TenantEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  tenantId!: string;

  @Column()
  tenantName!: string;

  @Column()
  tenantType!: string;

  @Column()
  country!: string;

  @Column()
  state!: string;

  @Column()
  city!: string;

  @Column()
  contactPersonName!: string;

  @Column()
  contactEmail!: string;

  @Column()
  contactMobile!: string;

  @Column({ nullable: true })
  alternateContactPersonName!: string;

  @Column({ nullable: true })
  alternateContactEmail!: string;

  @Column({ nullable: true })
  alternateContactMobile!: string;

  @Column()
  platformPurpose!: string;

  @Column()
  programmeCategory!: string;

  @Column()
  programmesOffered!: string;

  @Column()
  expectedUsers!: string;

  @Column()
  subscriptionPlan!: string;

  @Column({ default: "ACTIVE" })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}