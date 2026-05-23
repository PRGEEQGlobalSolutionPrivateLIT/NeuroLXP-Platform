import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("bulk_profile_upload_rows")
export class BulkProfileUploadRowEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  upload_job_id!: string;

  @Column({
    type: "int",
  })
  csv_row_number!: number;

  @Column({
    type: "jsonb",
  })
  raw_data_json!: Record<string, unknown>;

  @Column()
  validation_status!: string;

  @Column({
    type: "jsonb",
    nullable: true,
  })
  validation_errors_json!: string[] | null;

  @Column({
    default: "PENDING",
  })
  import_status!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}