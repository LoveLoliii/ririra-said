import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class BotConfig {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  app_id: string;
  @Column()
  app_secrect: string;
  @CreateDateColumn()
  created_at: Date;
  @Column()
  updated_at: Date;
}
