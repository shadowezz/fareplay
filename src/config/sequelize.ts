import { Sequelize } from "sequelize-typescript";
import * as dotenv from "dotenv";
import { Session } from "../models/Session";

dotenv.config();

const sequelize = new Sequelize(
  String(process.env.DB_DATABASE_NAME),
  String(process.env.DB_USERNAME),
  String(process.env.DB_PASSWORD),
  {
    host: process.env.DB_HOSTNAME,
    dialect: "mysql",
    models: [Session],
  }
);

export default sequelize;
