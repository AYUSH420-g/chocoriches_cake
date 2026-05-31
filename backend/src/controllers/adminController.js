import { isDatabaseConnected } from "../db.js";
import { BlockedDate } from "../models/BlockedDate.js";
import { Category } from "../models/Category.js";
import { Subcategory } from "../models/Subcategory.js";
import { Inquiry } from "../models/Inquiry.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { ServicePincode } from "../models/ServicePincode.js";
import { User } from "../models/User.js";
import { updateSiteSetting, getSiteSetting } from "../services/availabilityService.js";
import {
  adminOrderView,
  adminProductView,
  adminViewUser,
  blockedDateView,
  categoryView,
  subcategoryView,
  objectIdFilter,
  pincodeView,
  productId,
  slugify,
  todayIso,
} from "../utils/formatters.js";
import { memory } from "../utils/memoryStore.js";
import { adminOrders, updateOrder } from "./orderController.js";
import { clearProductListCache } from "./productController.js";

function objectIdOrField(id, field) {
  return /^[0-9a-fA-F]{24}$/.test(String(id || "")) ? { _id: id } : { [field]: id };
}

function productWeights(body) {
  const rawWeights = Array.isArray(body.weights) ? body.weights : [];
  const weights = rawWeights
    .map((weight) => ({
      label: String(weight.label || "").trim(),
      price: Number(weight.price || 0),
    }))
    .filter((weight) => weight.label && weight.price > 0);

  if (weights.length) {
    return weights;
  }

  return [
    {
      label: body.weight || body.defaultWeight || "Half Kg",
      price: Number(body.discountPrice || body.price || 0),
    },
  ].filter((weight) => weight.price > 0);
}

function productCategoryList(body) {
  const categories = Array.isArray(body.categories) ? body.categories : [body.category];
  return [...new Set(categories.map((category) => String(category || "").trim()).filter(Boolean))];
}

function productPayload(body) {
  const weights = productWeights(body);
  const categories = productCategoryList(body);
  const requestedDefaultWeight = String(body.defaultWeight || body.weight || weights[0]?.label || "Half Kg").trim();
  const defaultWeight = weights.some((weight) => weight.label === requestedDefaultWeight)
    ? requestedDefaultWeight
    : weights[0]?.label || "Half Kg";
  const defaultWeightPrice = weights.find((weight) => weight.label === defaultWeight)?.price || Number(body.discountPrice || body.price || 0);

  return {
    id: body.id || `prod-${Date.now()}`,
    name: body.name,
    price: Number(defaultWeightPrice || body.price || body.originalPrice || 0),
    discountPrice: Number(defaultWeightPrice || body.discountPrice || body.price || 0),
    discountPercent: Math.max(0, Math.min(95, Number(body.discountPercent || 0))),
    image: body.image || body.images?.[0]?.url,
    images: body.images?.length ? body.images : [{ url: body.image, alt: body.name }],
    category: categories[0] || "Cakes",
    categories: categories.length ? categories : ["Cakes"],
    subcategory: Array.isArray(body.subcategories) && body.subcategories.length ? body.subcategories[0] : (body.subcategory || ""),
    subcategories: Array.isArray(body.subcategories) ? body.subcategories.filter(Boolean) : (body.subcategory ? [body.subcategory] : []),
    description: body.description || "Fresh cake baked for your celebration.",
    longDescription: body.longDescription || body.description || "",
    ingredients: body.ingredients || "",
    allergens: body.allergens || "",
    stock: Number(body.stock || 0),
    weight: defaultWeight,
    defaultWeight,
    weights,
    ratings: Number(body.ratings || 4.8),
    numOfReviews: Number(body.numOfReviews || 0),
    featured: Boolean(body.featured || body.isFeatured),
    isActive: body.isActive !== false,
    isFeatured: Boolean(body.featured || body.isFeatured),
    isBestSeller: Boolean(body.isBestSeller),
    isTrending: Boolean(body.isTrending),
    customizable: Boolean(body.customizable),
    sameDayDelivery: Boolean(body.sameDayDelivery),
    tags: Array.isArray(body.tags) ? body.tags : [],
    sortOrder: Number(body.sortOrder || 0),
  };
}

export async function summary(_req, res) {
  const data = isDatabaseConnected()
    ? {
        products: await Product.countDocuments(),
        users: await User.countDocuments({ role: { $ne: "admin" } }),
        blockedUsers: await User.countDocuments({ isBlocked: true }),
        orders: await Order.countDocuments(),
        categories: await Category.countDocuments(),
        pincodes: await ServicePincode.countDocuments({ isActive: true }),
        blockedDates: await BlockedDate.countDocuments({ isActive: true }),
        inquiries: await Inquiry.countDocuments(),
      }
    : {
        products: memory.products.length,
        users: memory.users.filter((user) => user.role !== "admin").length,
        blockedUsers: memory.users.filter((user) => user.isBlocked).length,
        orders: memory.orders.length,
        categories: memory.categories.length,
        pincodes: memory.pincodes.filter((item) => item.isActive).length,
        blockedDates: memory.blockedDates.filter((item) => item.isActive).length,
        inquiries: memory.inquiries.length,
      };

  res.json({ ...data, settings: await getSiteSetting() });
}

export async function users(_req, res) {
  const usersList = isDatabaseConnected()
    ? await User.find({ role: { $ne: "admin" } }).sort({ createdAt: -1 }).lean()
    : memory.users.filter((user) => user.role !== "admin");

  res.json(usersList.map(adminViewUser));
}

export async function blockUser(req, res) {
  const { isBlocked = true, blockedReason = "" } = req.body;

  if (isDatabaseConnected()) {
    const user = await User.findOneAndUpdate(
      objectIdOrField(req.params.id, "email"),
      { isBlocked: Boolean(isBlocked), blockedReason },
      { new: true }
    ).lean();

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    res.json(adminViewUser(user));
    return;
  }

  let updatedUser = null;
  memory.users = memory.users.map((user) => {
    if (String(user.id || user.email) !== String(req.params.id)) {
      return user;
    }
    updatedUser = { ...user, isBlocked: Boolean(isBlocked), blockedReason };
    return updatedUser;
  });

  if (!updatedUser) {
    res.status(404).json({ message: "User not found." });
    return;
  }

  res.json(adminViewUser(updatedUser));
}

export async function products(req, res) {
  const page = parseInt(req.query.page, 10) || 0;
  const limit = parseInt(req.query.limit, 10) || 0;

  // If no pagination params, return all (backward compatible)
  if (!page || !limit) {
    const source = isDatabaseConnected()
      ? await Product.find({}).sort({ createdAt: -1 }).lean()
      : memory.products;
    res.json(source.map(adminProductView));
    return;
  }

  const skip = (page - 1) * limit;

  if (isDatabaseConnected()) {
    const [source, total] = await Promise.all([
      Product.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Product.countDocuments(),
    ]);
    res.json({
      products: source.map(adminProductView),
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
      hasMore: skip + source.length < total,
    });
  } else {
    const total = memory.products.length;
    const sliced = memory.products.slice(skip, skip + limit);
    res.json({
      products: sliced.map(adminProductView),
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
      hasMore: skip + sliced.length < total,
    });
  }
}

export async function createProduct(req, res) {
  const payload = productPayload(req.body);

  if (isDatabaseConnected()) {
    const product = await Product.create(payload);
    clearProductListCache();
    res.status(201).json(adminProductView(product.toObject()));
    return;
  }

  memory.products.push(payload);
  clearProductListCache();
  res.status(201).json(adminProductView(payload));
}

export async function updateProduct(req, res) {
  const { id: _ignoredId, ...updates } = productPayload(req.body);

  if (isDatabaseConnected()) {
    const product = await Product.findOneAndUpdate(objectIdFilter(req.params.id), updates, {
      new: true,
      runValidators: false,
    }).lean();

    if (!product) {
      res.status(404).json({ message: "Product not found." });
      return;
    }

    clearProductListCache();
    res.json(adminProductView(product));
    return;
  }

  let updatedProduct = null;
  memory.products = memory.products.map((product) => {
    if (productId(product) !== req.params.id) {
      return product;
    }
    updatedProduct = { ...product, ...updates };
    return updatedProduct;
  });

  if (!updatedProduct) {
    res.status(404).json({ message: "Product not found." });
    return;
  }

  clearProductListCache();
  res.json(adminProductView(updatedProduct));
}

export async function deleteProduct(req, res) {
  if (isDatabaseConnected()) {
    await Product.deleteOne(objectIdFilter(req.params.id));
  } else {
    memory.products = memory.products.filter((product) => productId(product) !== req.params.id);
  }

  clearProductListCache();
  res.status(204).end();
}

export async function categories(_req, res) {
  const categoriesList = isDatabaseConnected()
    ? await Category.find({}).sort({ sortOrder: 1, name: 1 }).lean()
    : memory.categories;

  res.json(categoriesList.map(categoryView));
}

export async function createCategory(req, res) {
  const payload = {
    name: req.body.name,
    slug: req.body.slug || slugify(req.body.name),
    description: req.body.description || "",
    image: req.body.image || "",
    isActive: req.body.isActive !== false,
    sortOrder: Number(req.body.sortOrder || 0),
  };

  if (isDatabaseConnected()) {
    const category = await Category.create(payload);
    res.status(201).json(categoryView(category.toObject()));
    return;
  }

  memory.categories.push(payload);
  res.status(201).json(categoryView(payload));
}

export async function updateCategory(req, res) {
  const updates = {
    ...req.body,
    slug: req.body.slug || slugify(req.body.name),
    sortOrder: Number(req.body.sortOrder || 0),
  };

  if (isDatabaseConnected()) {
    const oldCategory = await Category.findOne(objectIdOrField(req.params.id, "slug")).lean();
    const category = await Category.findOneAndUpdate(objectIdOrField(req.params.id, "slug"), updates, {
      new: true,
    }).lean();

    if (!category) {
      res.status(404).json({ message: "Category not found." });
      return;
    }

    if (oldCategory && oldCategory.name !== category.name) {
      await Subcategory.updateMany({ category: oldCategory.name }, { category: category.name });
    }

    res.json(categoryView(category));
    return;
  }

  let oldCategoryName = "";
  let updatedCategory = null;
  memory.categories = memory.categories.map((category) => {
    if (category.slug !== req.params.id && String(category._id || category.id) !== String(req.params.id)) {
      return category;
    }
    oldCategoryName = category.name;
    updatedCategory = { ...category, ...updates };
    return updatedCategory;
  });

  if (!updatedCategory) {
    res.status(404).json({ message: "Category not found." });
    return;
  }

  if (oldCategoryName && oldCategoryName !== updatedCategory.name && memory.subcategories) {
    memory.subcategories = memory.subcategories.map((subcat) => {
      if (subcat.category === oldCategoryName) {
        return { ...subcat, category: updatedCategory.name };
      }
      return subcat;
    });
  }

  res.json(categoryView(updatedCategory));
}

export async function deleteCategory(req, res) {
  let categoryName = "";
  if (isDatabaseConnected()) {
    const category = await Category.findOne(objectIdOrField(req.params.id, "slug")).lean();
    if (category) {
      categoryName = category.name;
      await Category.deleteOne({ _id: category._id });
      await Subcategory.deleteMany({ category: categoryName });
    }
  } else {
    const category = memory.categories.find(c => c.slug === req.params.id || String(c._id || c.id) === String(req.params.id));
    if (category) {
      categoryName = category.name;
      memory.categories = memory.categories.filter((c) => c.slug !== req.params.id && String(c._id || c.id) !== String(req.params.id));
      if (memory.subcategories) {
        memory.subcategories = memory.subcategories.filter((subcat) => subcat.category !== categoryName);
      }
    }
  }

  res.status(204).end();
}

export async function subcategories(_req, res) {
  const list = isDatabaseConnected()
    ? await Subcategory.find({}).sort({ sortOrder: 1, name: 1 }).lean()
    : memory.subcategories || [];

  res.json(list.map(subcategoryView));
}

export async function createSubcategory(req, res) {
  const payload = {
    name: req.body.name,
    slug: req.body.slug || `${slugify(req.body.category)}-${slugify(req.body.name)}`,
    category: req.body.category,
    isActive: req.body.isActive !== false,
    sortOrder: Number(req.body.sortOrder || 0),
  };

  if (isDatabaseConnected()) {
    const subcategory = await Subcategory.create(payload);
    res.status(201).json(subcategoryView(subcategory.toObject()));
    return;
  }

  if (!memory.subcategories) memory.subcategories = [];
  memory.subcategories.push(payload);
  res.status(201).json(subcategoryView(payload));
}

export async function updateSubcategory(req, res) {
  const updates = {
    ...req.body,
    slug: req.body.slug || `${slugify(req.body.category)}-${slugify(req.body.name)}`,
    sortOrder: Number(req.body.sortOrder || 0),
  };

  if (isDatabaseConnected()) {
    const subcategory = await Subcategory.findOneAndUpdate(objectIdOrField(req.params.id, "slug"), updates, {
      new: true,
    }).lean();

    if (!subcategory) {
      res.status(404).json({ message: "Subcategory not found." });
      return;
    }

    res.json(subcategoryView(subcategory));
    return;
  }

  let updatedSubcategory = null;
  if (!memory.subcategories) memory.subcategories = [];
  memory.subcategories = memory.subcategories.map((subcat) => {
    if (subcat.slug !== req.params.id && String(subcat._id || subcat.id) !== String(req.params.id)) {
      return subcat;
    }
    updatedSubcategory = { ...subcat, ...updates };
    return updatedSubcategory;
  });

  if (!updatedSubcategory) {
    res.status(404).json({ message: "Subcategory not found." });
    return;
  }

  res.json(subcategoryView(updatedSubcategory));
}

export async function deleteSubcategory(req, res) {
  if (isDatabaseConnected()) {
    await Subcategory.deleteOne(objectIdOrField(req.params.id, "slug"));
  } else {
    if (!memory.subcategories) memory.subcategories = [];
    memory.subcategories = memory.subcategories.filter(
      (subcat) => subcat.slug !== req.params.id && String(subcat._id || subcat.id) !== String(req.params.id)
    );
  }

  res.status(204).end();
}

export async function pincodes(_req, res) {
  const pincodesList = isDatabaseConnected()
    ? await ServicePincode.find({}).sort({ city: 1, pincode: 1 }).lean()
    : memory.pincodes;

  res.json(pincodesList.map(pincodeView));
}

export async function createPincode(req, res) {
  const payload = {
    pincode: String(req.body.pincode || "").trim(),
    city: req.body.city || "Bangalore",
    state: req.body.state || "",
    deliveryFee: Number(req.body.deliveryFee || 0),
    isActive: req.body.isActive !== false,
  };

  if (isDatabaseConnected()) {
    const pincode = await ServicePincode.create(payload);
    res.status(201).json(pincodeView(pincode.toObject()));
    return;
  }

  memory.pincodes.push(payload);
  res.status(201).json(pincodeView(payload));
}

export async function updatePincode(req, res) {
  const updates = {
    ...req.body,
    deliveryFee: Number(req.body.deliveryFee || 0),
    pincode: String(req.body.pincode || req.params.id).trim(),
  };

  if (isDatabaseConnected()) {
    const pincode = await ServicePincode.findOneAndUpdate(objectIdOrField(req.params.id, "pincode"), updates, {
      new: true,
    }).lean();

    if (!pincode) {
      res.status(404).json({ message: "Pincode not found." });
      return;
    }

    res.json(pincodeView(pincode));
    return;
  }

  let updatedPincode = null;
  memory.pincodes = memory.pincodes.map((pincode) => {
    if (pincode.pincode !== req.params.id) {
      return pincode;
    }
    updatedPincode = { ...pincode, ...updates };
    return updatedPincode;
  });

  if (!updatedPincode) {
    res.status(404).json({ message: "Pincode not found." });
    return;
  }

  res.json(pincodeView(updatedPincode));
}

export async function deletePincode(req, res) {
  if (isDatabaseConnected()) {
    await ServicePincode.deleteOne(objectIdOrField(req.params.id, "pincode"));
  } else {
    memory.pincodes = memory.pincodes.filter((pincode) => pincode.pincode !== req.params.id);
  }

  res.status(204).end();
}

export async function blockedDates(_req, res) {
  const dates = isDatabaseConnected()
    ? await BlockedDate.find({}).sort({ date: 1 }).lean()
    : memory.blockedDates;

  res.json(dates.map(blockedDateView));
}

export async function createBlockedDate(req, res) {
  const payload = {
    date: String(req.body.date || todayIso()).slice(0, 10),
    reason: req.body.reason || "",
    isActive: req.body.isActive !== false,
  };

  if (isDatabaseConnected()) {
    const blockedDate = await BlockedDate.create(payload);
    res.status(201).json(blockedDateView(blockedDate.toObject()));
    return;
  }

  memory.blockedDates.push(payload);
  res.status(201).json(blockedDateView(payload));
}

export async function updateBlockedDate(req, res) {
  const updates = {
    ...req.body,
    date: String(req.body.date || req.params.id).slice(0, 10),
  };

  if (isDatabaseConnected()) {
    const blockedDate = await BlockedDate.findOneAndUpdate(objectIdOrField(req.params.id, "date"), updates, {
      new: true,
    }).lean();

    if (!blockedDate) {
      res.status(404).json({ message: "Blocked date not found." });
      return;
    }

    res.json(blockedDateView(blockedDate));
    return;
  }

  let updatedDate = null;
  memory.blockedDates = memory.blockedDates.map((date) => {
    if (date.date !== req.params.id) {
      return date;
    }
    updatedDate = { ...date, ...updates };
    return updatedDate;
  });

  if (!updatedDate) {
    res.status(404).json({ message: "Blocked date not found." });
    return;
  }

  res.json(blockedDateView(updatedDate));
}

export async function deleteBlockedDate(req, res) {
  if (isDatabaseConnected()) {
    await BlockedDate.deleteOne(objectIdOrField(req.params.id, "date"));
  } else {
    memory.blockedDates = memory.blockedDates.filter((date) => date.date !== req.params.id);
  }

  res.status(204).end();
}

export async function inquiries(_req, res) {
  const inquiryList = isDatabaseConnected()
    ? await Inquiry.find({}).sort({ createdAt: -1 }).lean()
    : memory.inquiries;

  res.json(inquiryList.map((inquiry) => ({ ...inquiry, id: String(inquiry._id || inquiry.id) })));
}

export async function settings(_req, res) {
  res.json(await getSiteSetting());
}

export async function saveSettings(req, res) {
  res.json(await updateSiteSetting(req.body));
}

export {
  adminOrders as orders,
  updateOrder,
};
