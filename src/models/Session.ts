import { Table, Model, Column, DataType } from "sequelize-typescript";

@Table({
  timestamps: false,
  freezeTableName: true,
})
export class Session extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  sessionString!: string;

  @Column({
    type: DataType.STRING,
  })
  nonce?: string;

  @Column({
    type: DataType.STRING,
  })
  state?: string;

  @Column({
    type: DataType.STRING,
  })
  accessToken?: string;

  @Column({
    type: DataType.STRING,
  })
  codeVerifier?: string;

  @Column({
    type: DataType.STRING,
  })
  sub?: string;
}
