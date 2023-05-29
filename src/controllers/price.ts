import { Request, Response } from "express";
import { Session } from "../models/Session";
import authConstants from "../constants/auth";

type PriceInfo = {
  service: string;
  current_price: string;
  is_cheapest: boolean;
};

type QueryParam = {
  startLat: number;
  endLat: number;
  startLong: number;
  endLong: number;
};

let priceMultipliers: number[] = [8.5, 9, 9.5];
const refreshInterval: number = 1000 * 60 * 3;

setInterval(() => {
  for (let i = 0; i < priceMultipliers.length; i++) {
    let newMultiplier = Math.random();
    newMultiplier = newMultiplier < 0.5 ? newMultiplier + 0.5 : newMultiplier;
    priceMultipliers[i] = newMultiplier * 10;
  }
}, refreshInterval);

const getPrices = async (
  req: Request<{}, {}, {}, QueryParam>,
  res: Response
) => {
  const sessionId = String(req.cookies[authConstants.SESSION_COOKIE_NAME]);

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

  let prices: number[] = [];
  const { startLat, startLong, endLat, endLong } = req.query;
  const distance = calculateDistance(startLat, endLat, startLong, endLong);

  for (let i = 0; i < 3; i++) {
    const currentMultiplier = priceMultipliers[i];
    prices.push(distance * currentMultiplier);
  }
  const lowestPrice = Math.min(...prices);
  const priceResult: PriceInfo[] = [
    {
      service: "Grab",
      current_price: prices[0].toFixed(2),
      is_cheapest: prices[0] === lowestPrice,
    },
    {
      service: "Gojek",
      current_price: prices[1].toFixed(2),
      is_cheapest: prices[1] === lowestPrice,
    },
    {
      service: "Comfort Delgro",
      current_price: prices[2].toFixed(2),
      is_cheapest: prices[2] === lowestPrice,
    },
  ];
  return res.status(200).json(priceResult);
};

function calculateDistance(
  lat1: number,
  lat2: number,
  lon1: number,
  lon2: number
) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers

  return distance;
}

function toRadians(degrees: number) {
  return degrees * (Math.PI / 180);
}

export default {
  getPrices,
};
