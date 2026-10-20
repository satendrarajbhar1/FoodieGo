import User from "../models/userModel.js";
import Order from "../models/orderModel.js";

export const DELIVERY_RADIUS_KM = 5;     // shop ke paas ke riders
export const RESTAURANT_RADIUS_KM = 7;   // user ke paas ke restaurants

const ACTIVE = ["accepted", "preparing", "out_for_delivery"];

// lat/lng ko validate karo. Galat ho to null.
export const parseCoords = (lat, lng) => {
  if (lat === undefined || lat === null || lat === "") return null;
  if (lng === undefined || lng === null || lng === "") return null;

  const la = Number(lat);
  const lo = Number(lng);

  if (!Number.isFinite(la) || !Number.isFinite(lo)) return null;
  if (Math.abs(la) > 90 || Math.abs(lo) > 180) return null;

  return { lat: la, lng: lo };
};

// GeoJSON me pehle longitude aata hai, phir latitude
export const toPoint = ({ lat, lng }) => ({
  type: "Point",
  coordinates: [lng, lat],
});

// Haversine: a aur b dono [lng, lat] arrays hain. Result km me.
export const distanceKm = ([lng1, lat1], [lng2, lat2]) => {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
};

// Shop ke 5 km ke andar ke online riders, jinke paas abhi koi order nahi hai
export const findNearbyRiders = async (shopLocation) => {
  if (!shopLocation?.coordinates?.length) return [];

  const busyRiders = await Order.distinct("deliveryBoy", {
    deliveryBoy: { $ne: null },
    status: { $in: ACTIVE },
  });

  return User.find({
    role: "deliveryBoy",
    isAvailable: true,
    _id: { $nin: busyRiders },
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: shopLocation.coordinates,
        },
        $maxDistance: DELIVERY_RADIUS_KM * 1000,
      },
    },
  }).select("_id");
};