import SgidClient, { generatePkcePair } from "@opengovsg/sgid-client";
import * as dotenv from "dotenv";
import crypto from "crypto";

import { Session } from "../models/Session";

const PORT = 5001;

const SESSION_COOKIE_NAME = "farePlaySession";
const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
};

dotenv.config();

const redirectUri = String(
  process.env.SGID_REDIRECT_URI ?? `http://localhost:${PORT}/api/auth/callback`
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

const login = async (req, res) => {
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

  return res
    .cookie(SESSION_COOKIE_NAME, sessionId, SESSION_COOKIE_OPTIONS)
    .json({ url });
};

const sgIdCallBack = async (req, res): Promise<void> => {
  const authCode = String(req.query.code);
  const sessionId = String(req.cookies[SESSION_COOKIE_NAME]);

  const session = await Session.findOne({
    where: {
      sessionString: sessionId,
    },
  });

  if (!session) {
    console.error("callback error: session not found");
    res.status(401).json({ success: false, message: "An error has occurred" });
    return;
  }

  // Validate that the code verifier exists for this session
  if (session.codeVerifier === undefined) {
    console.error("callback error: codeVerifier not found");
    res.status(401).json({ success: false, message: "An error has occurred" });
    return;
  }

  // Exchange the authorization code and code verifier for the access token
  const { codeVerifier, nonce } = session;
  try {
    const { accessToken, sub } = await sgid.callback({
      code: authCode,
      nonce,
      codeVerifier,
    });
    session.accessToken = accessToken;
    session.sub = sub;
  } catch (error) {
    console.error(`callback error: get accesstoken failed: ${error}`);
    res.status(401).json({ success: false, message: "An error has occurred" });
    return;
  }

  try {
    await Session.update(
      { ...session.dataValues },
      { where: { id: session.id } }
    );
  } catch (error) {
    console.error(
      `callback error: failed to update session with accesstoken and sub: ${error}`
    );
    res.status(401).json({ success: false, message: "An error has occurred" });
    return;
  }

  // Successful login, redirect to static loading site
  res.redirect(frontendHost);
};

const getUserInfo = async (req, res) => {
  const sessionId = String(req.cookies[SESSION_COOKIE_NAME]);

  // Retrieve the access token and sub
  const session = await Session.findOne({
    where: {
      sessionString: sessionId,
    },
  });

  if (!session) {
    console.error("userinfo error: session not found");
    return res.sendStatus(401);
  }

  const accessToken = session.accessToken;
  const sub = session.sub;

  // User is not authenticated
  if (
    accessToken === null ||
    sub === null ||
    accessToken === undefined ||
    sub === undefined
  ) {
    return res.sendStatus(401);
  }
  const userinfo = await sgid.userinfo({
    accessToken,
    sub,
  });
  return res.json(userinfo);
};

const logout = async (req, res) => {
  const sessionId = String(req.cookies[SESSION_COOKIE_NAME]);
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
};

const checkIsLoggedIn = async (req, res) => {
  const sessionId = String(req.cookies[SESSION_COOKIE_NAME]);
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
  if (accessToken === null || sub === null) {
    return res.sendStatus(401);
  }

  return res.sendStatus(200);
};

export default {
  login,
  logout,
  checkIsLoggedIn,
  sgIdCallBack,
  getUserInfo,
};
