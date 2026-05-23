import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("profile_field_values")
export class ProfileFieldValueEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  profile_id!: string;

  @Column()
  field_key!: string;

  @Column({
    type: "text",
    nullable: true,
  })
  field_value!: string | null;

  @Column({
    default: "CSV",
  })
  source!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}