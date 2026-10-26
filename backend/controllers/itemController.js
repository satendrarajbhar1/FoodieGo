
import Item from "../models/itemModel.js";
import Shop from "../models/shopModel.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

export const addItem = async (req, res) => {
  try {
    const { name, category, foodType, price } = req.body;

    if (!name || !category || !foodType || price === undefined) {
      return res.status(400).json({
        message: "Please fill all food details."
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Please select a food image."
      });
    }

    const shop = await Shop.findOne({ owner: req.userId });

    if (!shop) {
      return res.status(404).json({
        message: "Your shop was not found."
      });
    }

    const imageUrl = await uploadOnCloudinary(req.file.path);

    if (!imageUrl) {
      return res.status(500).json({
        message: "Image upload failed."
      });
    }

  
const item = await Item.create({
  name: name.trim(),
  category,
  FoodType: foodType,
  price: Number(price),
  image: imageUrl,
  shop: shop._id
});

shop.items.push(item._id);
await shop.save();


   return res.status(201).json({
  message: "Food item added successfully!",
  item
});

  } catch (error) {
    console.error("ADD ITEM ERROR:", error);
    return res.status(500).json({
      message: error.message || "Failed to add food item."
    });
  }
};

export const editItem = async (req, res) => {
  try {
    const { name, category, foodType, price } = req.body;

    const shop = await Shop.findOne({ owner: req.userId });

    if (!shop) {
      return res.status(404).json({
        message: "Your shop was not found."
      });
    }

    const item = await Item.findOne({
      _id: req.params.itemId,
      shop: shop._id
    });

    if (!item) {
      return res.status(404).json({
        message: "Food item not found."
      });
    }

    if (name !== undefined) item.name = name.trim();
    if (category !== undefined) item.category = category;
    if (foodType !== undefined) item.FoodType = foodType;
    if (price !== undefined) item.price = Number(price);

    if (req.file) {
      const imageUrl = await uploadOnCloudinary(req.file.path);
      if (!imageUrl) {
        return res.status(500).json({
          message: "Image upload failed."
        });
      }
      item.image = imageUrl;
    }

    await item.save();

    return res.status(200).json({
      message: "Food item updated successfully!",
      item
    });
  } catch (error) {
    console.error("EDIT ITEM ERROR:", error);
    return res.status(500).json({
      message: error.message || "Failed to update food item."
    });
  }
};


function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const searchSuggestions = async (req, res) => {
  try {
    const q = req.query.q?.trim();
    const city = req.query.city?.trim();

    if (!q) {
      return res.status(200).json({ shops: [], items: [] });
    }

    const regex = new RegExp(escapeRegex(q), "i");

    const shopFilter = { name: regex };
    const itemFilter = { $or: [{ name: regex }, { category: regex }] };

    if (city) {
      const cityShops = await Shop.find({
        city: { $regex: `^${escapeRegex(city)}$`, $options: "i" },
      }).select("_id");

      const shopIds = cityShops.map((shop) => shop._id);

      shopFilter._id = { $in: shopIds };
      itemFilter.shop = { $in: shopIds };
    }

    const [shops, items] = await Promise.all([
      Shop.find(shopFilter).select("name image city").limit(5),

      Item.find(itemFilter)
        .select("name image price category shop")
        .populate("shop", "name")
        .limit(8),
    ]);

    // Agar city me kuch nahi mila to poore platform me dhundo
    if (city && shops.length === 0 && items.length === 0) {
      const [allShops, allItems] = await Promise.all([
        Shop.find({ name: regex }).select("name image city").limit(5),

        Item.find({ $or: [{ name: regex }, { category: regex }] })
          .select("name image price category shop")
          .populate("shop", "name")
          .limit(8),
      ]);

      return res.status(200).json({ shops: allShops, items: allItems });
    }

    return res.status(200).json({ shops, items });
  } catch (error) {
    console.error("SEARCH SUGGESTIONS ERROR:", error);
    return res.status(500).json({
      message: "Unable to fetch suggestions.",
    });
  }
};

