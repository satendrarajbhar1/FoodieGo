
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

// User ki city ke shops aur items me search suggestions
export const searchSuggestions = async (req, res) => {
  try {
    const q = req.query.q?.trim();
    const city = req.query.city?.trim();

    if (!q || !city) {
      return res.status(200).json({ shops: [], items: [] });
    }

    const regex = new RegExp(escapeRegex(q), "i");

    // Pehle us city ke saare shops nikalo
    const cityShops = await Shop.find({
      city: { $regex: `^${escapeRegex(city)}$`, $options: "i" },
    }).select("_id");

    const shopIds = cityShops.map((shop) => shop._id);

    const [shops, items] = await Promise.all([
      Shop.find({ _id: { $in: shopIds }, name: regex })
        .select("name image city")
        .limit(5),

      Item.find({
        shop: { $in: shopIds },
        $or: [{ name: regex }, { category: regex }],
      })
        .select("name image price category shop")
        .populate("shop", "name")
        .limit(8),
    ]);

    return res.status(200).json({ shops, items });
  } catch (error) {
    console.error("SEARCH SUGGESTIONS ERROR:", error);
    return res.status(500).json({
      message: "Unable to fetch suggestions.",
    });
  }
};