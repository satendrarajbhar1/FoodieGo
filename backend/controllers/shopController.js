import fs from "fs";
import mongoose from "mongoose";
import Shop from "../models/shopModel.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import {
  RESTAURANT_RADIUS_KM,
  parseCoords,
  toPoint,
  distanceKm,
} from "../utils/geo.js";

const removeTempFile = (file) => {
  if (file?.path && fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }
};

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const createEditShop = async (req, res) => {
  try {
    const { name, city, state, address } = req.body;

    if (!req.userId) {
      removeTempFile(req.file);
      return res.status(401).json({
        message: "User not authenticated",
      });
    }

    if (
      !name?.trim() ||
      !city?.trim() ||
      !state?.trim() ||
      !address?.trim()
    ) {
      removeTempFile(req.file);
      return res.status(400).json({
        message: "Please fill all required fields",
      });
    }

    // Shop ki location (frontend se lat/lng aata hai)
    const coords = parseCoords(req.body.lat, req.body.lng);
    const sentCoords = req.body.lat !== undefined && req.body.lat !== "";

    if (sentCoords && !coords) {
      removeTempFile(req.file);
      return res.status(400).json({
        message: "Invalid shop location",
      });
    }

    let shop = await Shop.findOne({ owner: req.userId });

    if (!shop && !coords) {
      removeTempFile(req.file);
      return res.status(400).json({
        message: "Please set your shop location",
      });
    }

    let image = shop?.image || "";

    if (req.file) {
      try {
        const uploadedImage = await uploadOnCloudinary(req.file.path);

        if (!uploadedImage) {
          return res.status(500).json({
            message: "Image upload failed",
          });
        }

        image = uploadedImage;
      } catch (uploadError) {
        console.error("IMAGE UPLOAD ERROR:", uploadError.message);

        return res.status(500).json({
          message: "Image upload failed. Please try again.",
        });
      }
    }

    const shopData = {
      name: name.trim(),
      city: city.trim(),
      state: state.trim(),
      address: address.trim(),
      image,
      owner: req.userId,
    };

    // Location bheji ho tabhi update, warna purani rehne do
    if (coords) {
      shopData.location = toPoint(coords);
    }

    if (!shop) {
      shop = await Shop.create(shopData);
    } else {
      shop = await Shop.findByIdAndUpdate(
        shop._id,
        { $set: shopData },
        { new: true, runValidators: true }
      );
    }

    await shop.populate("owner");

    return res.status(200).json({ shop });
  } catch (error) {
    removeTempFile(req.file);
    console.error("CREATE/EDIT SHOP ERROR:", error);

    return res.status(500).json({
      message: "Something went wrong while saving the shop",
    });
  }
};

export const getMyShop = async (req, res) => {
  try {
    const shop = await Shop.findOne({
      owner: req.userId,
    }).populate("owner items");

    if (!shop) {
      return res.status(404).json({
        message: "Shop not found",
      });
    }

    return res.status(200).json(shop);
  } catch (error) {
    console.error("GET MY SHOP ERROR:", error);

    return res.status(500).json({
      message: "Something went wrong while fetching the shop",
    });
  }
};

// User ke paas ke restaurants.
// lat/lng mile to radius se (distance ke saath), warna city se.
export const getNearbyShops = async (req, res) => {
  try {
    const city = req.query.city?.trim();
    const state = req.query.state?.trim();
    const coords = parseCoords(req.query.lat, req.query.lng);

    if (!coords && !city) {
      return res.status(400).json({
        message: "Please provide a location to find restaurants.",
      });
    }

    const cityQuery = () => {
      const query = {
        city: { $regex: `^${escapeRegex(city)}$`, $options: "i" },
      };

      if (state) {
        query.state = { $regex: `^${escapeRegex(state)}$`, $options: "i" };
      }

      return query;
    };

    // Location nahi mili: purana city wala tareeka
    if (!coords) {
      const shops = await Shop.find(cityQuery())
        .populate("items")
        .sort({ createdAt: -1 });

      return res.status(200).json({ shops });
    }

    // $near apne aap nazdeeki ke hisab se sort karta hai
    const nearShops = await Shop.find({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [coords.lng, coords.lat] },
          $maxDistance: RESTAURANT_RADIUS_KM * 1000,
        },
      },
    }).populate("items");

    const shops = nearShops.map((shop) => {
      const obj = shop.toObject();
      obj.distanceKm =
        Math.round(
          distanceKm(
            [coords.lng, coords.lat],
            shop.location.coordinates
          ) * 10
        ) / 10;
      return obj;
    });

    // Purane shops jinki location save nahi hai, wo city se aate rahenge
    if (city) {
      const legacy = await Shop.find({
        ...cityQuery(),
        "location.coordinates": { $exists: false },
      }).populate("items");

      legacy.forEach((shop) => {
        const obj = shop.toObject();
        obj.distanceKm = null;
        shops.push(obj);
      });
    }

    return res.status(200).json({ shops });
  } catch (error) {
    console.error("GET RESTAURANTS ERROR:", error);

    return res.status(500).json({
      message: "Unable to fetch restaurants.",
    });
  }
};


export const getShopById = async (req, res) => {
  try {
    const { shopId } = req.params;

    if (!mongoose.isValidObjectId(shopId)) {
      return res.status(400).json({
        message: "Invalid shop id",
      });
    }

    const shop = await Shop.findById(shopId).populate("items");

    if (!shop) {
      return res.status(404).json({
        message: "Shop not found",
      });
    }

    return res.status(200).json({ shop });
  } catch (error) {
    console.error("GET SHOP BY ID ERROR:", error);

    return res.status(500).json({
      message: "Something went wrong while fetching the shop",
    });
  }
};


export const getAllShops = async (req, res) => {
  try {
    const shops = await Shop.find()
      .populate("items")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({ shops });
  } catch (error) {
    console.error("GET ALL SHOPS ERROR:", error);

    return res.status(500).json({
      message: "Unable to fetch restaurants.",
    });
  }
};