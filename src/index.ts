import express, { Router } from "express";
import sequelize from "./config/sequelize";
import cors from "cors";
import SgidClient, { generatePkcePair } from "@opengovsg/sgid-client";
import * as dotenv from "dotenv";
import crypto from "crypto";
import cookieParser from "cookie-parser";
import open from "open";

import { Session } from "./models/Session";

dotenv.config();

const PORT = 5001;
const redirectUri = String(
  process.env.SGID_REDIRECT_URI ?? `http://localhost:${PORT}/auth/callback`
);
const frontendHost = String(
  process.env.SGID_FRONTEND_HOST ?? "http://localhost:5173"
);

const sgid = new SgidClient({
  clientId: String(process.env.SGID_CLIENT_ID),
  clientSecret: String(process.env.SGID_CLIENT_SECRET),
  privateKey: String(process.env.SGID_PRIVATE_KEY),
  redirectUri,
});

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

const SESSION_COOKIE_NAME = "farePlaySession";
const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
};

type PriceInfo = {
  service: string;
  current_price: number;
};

app.use(
  cors({
    credentials: true,
    origin: frontendHost,
  })
);

apiRouter.get("/auth/login", async (req, res) => {
  const sessionId = crypto.randomUUID();
  // Use search params to store state so other key-value pairs
  // can be added easily
  const state = new URLSearchParams({});

  // Generate a PKCE pair
  const { codeChallenge, codeVerifier } = generatePkcePair();

  const { url, nonce } = sgid.authorizationUrl({
    // We pass the user's ice cream preference as the state,
    // so after they log in, we can display it together with the
    // other user info.
    state: state.toString(),
    codeChallenge,
    // Scopes that all sgID relying parties can access by default
    scope: ["openid", "myinfo.name"],
  });
  try {
    await Session.create({
      sessionString: sessionId,
      state: state.toString(),
      nonce,
      codeVerifier,
    });
  } catch (error) {
    console.error(`failed to create session: ${error}`);
    return res.status(500).json({ message: "Server Error" });
  }

  //   sessionData[sessionId] = {
  //     state,
  //     nonce,
  //     codeVerifier,
  //   };
  return res
    .cookie(SESSION_COOKIE_NAME, sessionId, SESSION_COOKIE_OPTIONS)
    .json({ url });
});

apiRouter.get("/auth/callback", async (req, res): Promise<void> => {
  const authCode = String(req.query.code);
  const state = String(req.query.state);
  const sessionId = String(req.cookies[SESSION_COOKIE_NAME]);

  const session = await Session.findOne({
    where: {
      sessionString: sessionId,
    },
  });

  if (!session) {
    console.error("callback error: session not found");
    res.redirect(`${frontendHost}/error`);
    return;
  }

  //   const session = { ...sessionData[sessionId] };
  // Validate that the state matches what we passed to sgID for this session
  if (session.state?.toString() !== state) {
    console.error("callback error: invalid state");
    res.redirect(`${frontendHost}/error`);
    return;
  }

  // Validate that the code verifier exists for this session
  if (session.codeVerifier === undefined) {
    console.error("callback error: codeVerifier not found");
    res.redirect(`${frontendHost}/error`);
    return;
  }

  // Exchange the authorization code and code verifier for the access token
  const { codeVerifier, nonce } = session;
  const { accessToken, sub } = await sgid.callback({
    code: authCode,
    nonce,
    codeVerifier,
  });

  session.accessToken = accessToken;
  session.sub = sub;

  try {
    await Session.update({ ...session }, { where: { id: session.id } });
  } catch (error) {
    console.error(
      `callback error: failed to update session with accesstoken and sub: ${error}`
    );
  }

  // sessionData[sessionId] = session;

  // Successful login, redirect to logged in state
  res.redirect(`${frontendHost}/logged-in`);
});

apiRouter.get("/userinfo", async (req, res) => {
  const sessionId = String(req.cookies[SESSION_COOKIE_NAME]);

  // Retrieve the access token and sub
  // const session = sessionData[sessionId];
  const session = await Session.findOne({
    where: {
      sessionString: sessionId,
    },
  });

  if (!session) {
    console.error("callback error: session not found");
    return res.sendStatus(401);
  }

  const accessToken = session.accessToken;
  const sub = session.sub;

  // User is not authenticated
  if (accessToken === undefined || sub === undefined) {
    return res.sendStatus(401);
  }
  const userinfo = await sgid.userinfo({
    accessToken,
    sub,
  });
  return res.json(userinfo);
});

apiRouter.get("/auth/logout", async (req, res) => {
  const sessionId = String(req.cookies[SESSION_COOKIE_NAME]);
  // delete sessionData[sessionId];
  try {
    await Session.destroy({
      where: {
        sessionString: sessionId,
      },
    });
  } catch (error) {
    console.error(`logout error: failed to delete session: ${error}`);
  }
  return res
    .clearCookie(SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS)
    .sendStatus(200);
});

apiRouter.get("/prices", async (req, res) => {
  const grabPrice = generateRandomPrice();
  const gojekPrice = generateRandomPrice();
  const priceResult: PriceInfo[] = [
    {
      service: "grab",
      current_price: grabPrice,
    },
    {
      service: "gojek",
      current_price: gojekPrice,
    },
  ];
  return res.json(priceResult);
});

function generateRandomPrice() {
  const minPrice = 10;
  const maxPrice = 50;
  return Math.random() * (maxPrice - minPrice) + minPrice;
}

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
