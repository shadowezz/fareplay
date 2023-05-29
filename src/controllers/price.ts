import { Session } from "../models/Session";
import authConstants from "../constants/auth";

type PriceInfo = {
  service: string;
  current_price: number;
  is_cheapest: boolean;
};

const getPrices = async (req, res) => {
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
  for (let i = 0; i < 3; i++) {
    prices.push(generateRandomPrice());
  }
  const lowestPrice = Math.min(...prices);
  const priceResult: PriceInfo[] = [
    {
      service: "Grab",
      current_price: prices[0],
      is_cheapest: prices[0] === lowestPrice,
    },
    {
      service: "Gojek",
      current_price: prices[1],
      is_cheapest: prices[1] === lowestPrice,
    },
    {
      service: "Comfort Delgro",
      current_price: prices[2],
      is_cheapest: prices[2] === lowestPrice,
    },
  ];
  return res.status(200).json(priceResult);
};

function generateRandomPrice() {
  const minPrice = 10;
  const maxPrice = 50;
  return Math.random() * (maxPrice - minPrice) + minPrice;
}

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

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

export default {
  getPrices,
};
