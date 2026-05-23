import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("bulk_profile_upload_jobs")
export class BulkProfileUploadJobEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  tenant_id!: string;

  @Column()
  uploaded_by!: string;

  @Column()
  file_name!: string;

  @Column({
    type: "int",
    default: 0,
  })
  total_rows!: number;

  @Column({
    type: "int",
    default: 0,
  })
  valid_rows!: number;

  @Column({
    type: "int",
    default: 0,
  })
  invalid_rows!: number;

  @Column({
    type: "int",
    default: 0,
  })
  imported_rows!: number;

  @Column({
    type: "int",
    default: 0,
  })
  skipped_rows!: number;

  @Column({
    default: "VALIDATED",
  })
  status!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}