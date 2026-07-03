import { isDatabaseConnected } from "../db.js";
import { BlockedDate } from "../models/BlockedDate.js";
import { CartItem } from "../models/CartItem.js";
import { Category } from "../models/Category.js";
import { Subcategory } from "../models/Subcategory.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { ServicePincode } from "../models/ServicePincode.js";
import { SiteSetting } from "../models/SiteSetting.js";
import { User } from "../models/User.js";
import { config } from "../config/env.js";
import { hashPassword, verifyPassword } from "../utils/auth.js";
import { slugify } from "../utils/formatters.js";
import { initialOrders, memory, products, profileUser } from "../utils/memoryStore.js";
import crypto from "node:crypto";

async function removeStaleUserIndexes() {
  const indexes = await User.collection.indexes();
  const phoneIndex = indexes.find((index) => index.name === "phone_1" && index.unique);

  if (!phoneIndex) {
    return;
  }

  await User.collection.dropIndex("phone_1");
  console.info("Dropped stale unique users.phone index.");
}

export async function seedDatabase() {
  const adminPasswordFields = await hashPassword(config.adminSeed.password);
  const memoryProfile = memory.users.find((user) => user.email === profileUser.email);

  if (!config.isProduction && memoryProfile && (!memoryProfile.passwordHash || !memoryProfile.salt)) {
    Object.assign(memoryProfile, await hashPassword(crypto.randomBytes(32).toString("hex")));
  }

  if (!memory.users.some((user) => user.email === config.adminSeed.email)) {
    memory.users.push({
      name: config.adminSeed.name,
      email: config.adminSeed.email,
      ...adminPasswordFields,
      avatar: profileUser.avatar,
      membership: "Administrator",
      role: "admin",
      isBlocked: false,
    });
  }

  if (memory.categories.length === 0) {
    memory.categories = [...new Set(memory.products.map((product) => product.category || "Cakes"))].map(
      (name, index) => ({
        name,
        slug: slugify(name),
        description: `${name} collection`,
        isActive: true,
        sortOrder: index,
      })
    );
  }

  if (memory.pincodes.length === 0) {
    memory.pincodes.push({
      pincode: "560001",
      isActive: true,
    });
  }

  if (!isDatabaseConnected()) {
    return;
  }

  await removeStaleUserIndexes().catch((error) => {
    console.warn(`Could not drop stale users.phone index: ${error.message}`);
  });

  if ((await Product.countDocuments()) === 0) {
    await Product.insertMany(products);
  }

  await CartItem.deleteMany({
    $or: [
      { productId: { $exists: false } },
      { $and: [{ sessionId: { $exists: false } }, { userEmail: { $exists: false } }] },
      { id: { $in: ["1", "2"] } },
    ],
  });

  if (!config.isProduction && (await Order.countDocuments()) === 0) {
    await Order.insertMany(initialOrders);
  }

  if (!config.isProduction && (await User.countDocuments()) === 0) {
    const password = await hashPassword(crypto.randomBytes(32).toString("hex"));
    await User.create({ ...profileUser, email: profileUser.email.toLowerCase(), ...password });
  }

  const existingAdmin = await User.findOne({ email: config.adminSeed.email });
  const adminPasswordMatches = existingAdmin
    ? await verifyPassword(config.adminSeed.password, existingAdmin)
    : false;
  if (!existingAdmin) {
    await User.create({
      name: config.adminSeed.name,
      email: config.adminSeed.email,
      ...adminPasswordFields,
      avatar: profileUser.avatar,
      membership: "Administrator",
      role: "admin",
      isBlocked: false,
    });
  } else if (
    existingAdmin.role !== "admin" ||
    !existingAdmin.passwordHash ||
    !existingAdmin.salt ||
    Number(existingAdmin.passwordIterations || 100_000) < 210_000 ||
    !adminPasswordMatches
  ) {
    await User.updateOne(
      { email: config.adminSeed.email },
      {
        $set: {
          ...adminPasswordFields,
          name: config.adminSeed.name,
          role: "admin",
          membership: "Administrator",
          isBlocked: false,
        },
        $inc: { tokenVersion: 1 },
      }
    );
  }

  if ((await SiteSetting.countDocuments({ key: "site" })) === 0) {
    await SiteSetting.create(memory.setting);
  }

  if ((await ServicePincode.countDocuments()) === 0) {
    await ServicePincode.create(memory.pincodes[0]);
  }

  if ((await Category.countDocuments()) === 0) {
    const productCategories = await Product.distinct("category");
    const categoryNames = productCategories.length
      ? productCategories
      : [...new Set(products.map((product) => product.category || "Cakes"))];
    await Category.insertMany(
      categoryNames.map((name, index) => ({
        name,
        slug: slugify(name),
        description: `${name} collection`,
        isActive: true,
        sortOrder: index,
      }))
    );
  }

  // Seed subcategories in memory
  if (!memory.subcategories || memory.subcategories.length === 0) {
    memory.subcategories = [
      { name: "Chocolate Cakes", slug: "signature-chocolate-cakes", category: "Signature", isActive: true, sortOrder: 1 },
      { name: "Fruit Cakes", slug: "signature-fruit-cakes", category: "Signature", isActive: true, sortOrder: 2 },
      { name: "Tiers & Tiered", slug: "wedding-tiers-tiered", category: "Wedding", isActive: true, sortOrder: 1 },
      { name: "Cupcakes", slug: "celebration-cupcakes", category: "Celebration", isActive: true, sortOrder: 1 }
    ];
  }

  // Seed subcategories in database
  if (isDatabaseConnected() && (await Subcategory.countDocuments()) === 0) {
    await Subcategory.insertMany(memory.subcategories);
  }
}
