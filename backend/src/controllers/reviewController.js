import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { Review } from "../models/Review.js";
import { isDatabaseConnected } from "../db.js";
import { memory } from "../utils/memoryStore.js";
import crypto from "node:crypto";

export async function addReview(req, res) {
  const productId = typeof req.body.productId === "string" ? req.body.productId.trim().slice(0, 100) : "";
  const rating = req.body.rating;
  const comment = typeof req.body.comment === "string" ? req.body.comment.trim().slice(0, 1000) : "";
  const user = req.user;

  if (!productId || !rating || !comment) {
    return res.status(400).json({ message: "Product ID, rating, and comment are required." });
  }

  const parsedRating = Number(rating);
  if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5." });
  }

  let product = null;
  if (isDatabaseConnected()) {
    product = await Product.findOne({ id: productId }).lean();
  } else {
    product = memory.products.find((p) => p.id === productId);
  }

  if (!product) {
    return res.status(404).json({ message: "Product not found." });
  }

  // Check if user has ordered this product
  let hasOrdered = false;
  if (isDatabaseConnected()) {
    const order = await Order.findOne({
      customerEmail: user.email,
      status: "Delivered",
      $or: [
        { items: { $elemMatch: { productId } } },
        { items: { $elemMatch: { name: product.name } } },
        { items: product.name },
      ],
    }).lean();
    hasOrdered = Boolean(order);
  } else {
    const orders = memory.orders.filter(
      (o) => o.customerEmail === user.email && o.status === "Delivered" && (o.items || []).some((item) => (
        typeof item === "string" ? item === product.name : item.productId === productId || item.name === product.name
      ))
    );
    hasOrdered = orders.length > 0;
  }

  if (!hasOrdered) {
    return res.status(403).json({ message: "You can only review products that have been delivered to you." });
  }

  const userId = String(user._id || user.id);

  // Check if already reviewed
  let existingReview = null;
  if (isDatabaseConnected()) {
    existingReview = await Review.findOne({ productId, userId }).lean();
  } else {
    existingReview = memory.reviews?.find((r) => r.productId === productId && r.userId === userId);
  }

  if (existingReview) {
    return res.status(400).json({ message: "You have already reviewed this product." });
  }

  const reviewPayload = {
    productId,
    userId,
    userName: user.name,
    rating: parsedRating,
    comment
  };

  if (isDatabaseConnected()) {
    await Review.create(reviewPayload);

    // Aggregate ratings
    const reviews = await Review.find({ productId }).lean();
    const numOfReviews = reviews.length;
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRating / numOfReviews;

    await Product.findOneAndUpdate(
      { id: productId },
      { ratings: Number(avgRating.toFixed(1)), numOfReviews }
    );
  } else {
    if (!memory.reviews) memory.reviews = [];
    memory.reviews.push({ ...reviewPayload, id: crypto.randomUUID(), createdAt: new Date() });

    const reviews = memory.reviews.filter((r) => r.productId === productId);
    const numOfReviews = reviews.length;
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRating / numOfReviews;
    const memProductIndex = memory.products.findIndex((p) => p.id === productId);
    if (memProductIndex > -1) {
      memory.products[memProductIndex].ratings = Number(avgRating.toFixed(1));
      memory.products[memProductIndex].numOfReviews = numOfReviews;
    }
  }

  res.status(201).json({ message: "Review added successfully." });
}

export async function getProductReviews(req, res) {
  const productId = String(req.params.productId || "").trim().slice(0, 100);

  let reviews = [];
  if (isDatabaseConnected()) {
    reviews = await Review.find({ productId }).sort({ createdAt: -1 }).lean();
  } else {
    reviews = (memory.reviews || [])
      .filter((r) => r.productId === productId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  res.json(reviews.map(({ userId: _userId, ...review }) => review));
}

export async function getUserReviews(req, res) {
  const userId = String(req.user._id || req.user.id);

  let reviews = [];
  if (isDatabaseConnected()) {
    reviews = await Review.find({ userId }).lean();
  } else {
    reviews = (memory.reviews || []).filter((r) => r.userId === userId);
  }

  res.json(reviews);
}
