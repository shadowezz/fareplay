import express, { Router } from "express";
import sequelize from "./config/sequelize";
import cors from "cors";
import SgidClient, { generatePkcePair } from "@opengovsg/sgid-client";
import * as dotenv from "dotenv";
import crypto from "crypto";
import cookieParser from "cookie-parser";
import open from "open";

import authController from "./controllers/auth";
import priceController from "./controllers/price";

import { Session } from "./models/Session";

dotenv.config();

const PORT = 5001;
// const frontendHost = String(
//   process.env.SGID_FRONTEND_HOST ?? "http://localhost:5173"
// );

// const sgid = new SgidClient({
//   clientId: String(process.env.SGID_CLIENT_ID),
//   clientSecret: String(process.env.SGID_CLIENT_SECRET),
//   privateKey: String(process.env.SGID_PRIVATE_KEY),
//   redirectUri,
// });

const app = express();

// Establish the database connection
sequelize
  .authenticate()
  .then(() => {
    console.log("Connected to the database.");
  })
  .catch((error) => {
    console.error("Unable to connect to the database:", error);
  });

// Synchronize the Sequelize models
sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("Database synchronized.");
  })
  .catch((error) => {
    console.error("Unable to sync the database:", error);
  });

const apiRouter = Router();

app.use(
  cors({
    credentials: true,
    origin: "*",
  })
);

// set routes
apiRouter.get("/auth/login", authController.login);
apiRouter.get("/auth/callBack", authController.sgIdCallBack);
apiRouter.get("/auth/logout", authController.logout);
apiRouter.get("/auth/is_logged_in", authController.checkIsLoggedIn);
apiRouter.get("/userinfo", authController.getUserInfo);

apiRouter.get("/prices", priceController.getPrices);

const initServer = async (): Promise<void> => {
  try {
    app.use(cookieParser());
    app.use("/api", apiRouter);

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
      void open(`http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(
      "Something went wrong while starting the server. Please restart the server."
    );
    console.error(error);
  }
};

void initServer();
