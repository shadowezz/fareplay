// import { Model, DataTypes } from "sequelize";
import {
  Table,
  Model,
  Column,
  DataType,
  AutoIncrement,
} from "sequelize-typescript";
// import sequelize from "../config/sequelize";

@Table({
  timestamps: false,
  freezeTableName: true,
})
export class Session extends Model {
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
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

// const Session = sequelize.define(
//   "Session",
//   {
//     id: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       primaryKey: true,
//       autoIncrement: false,
//     },
//     nonce: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//     state: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//     accessToken: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//     codeVerifier: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//     sub: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//   },
//   {
//     tableName: "sessions",
//   }
// );

// interface SessionData {
//   id: number;
//   sessionString: string;
//   nonce?: string;
//   state?: string;
//   accessToken?: string;
//   codeVerifier?: string;
//   sub?: string;
// }

// export default Session;

// class Session extends Model {
//   public id!: number;
//   public sessionString!: string;
//   public nonce!: string;
//   public state!: string;
//   public accessToken!: string;
//   public codeVerifier!: string;
//   public sub!: string;
// }

// Session.init(
//   {
//     id: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       primaryKey: true,
//       autoIncrement: true,
//     },
//     sessionString: {
//       type: DataTypes.STRING,
//       allowNull: false,
//       unique: true,
//     },
//     nonce: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//     state: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//     accessToken: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//     codeVerifier: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//     sub: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//   },
//   {
//     sequelize,
//     modelName: "Session",
//     freezeTableName: true,
//   }
// );

// export default Session;
