import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    discountPercent: { type: Number, default: 0 },
    image: { type: String, required: true },
    images: [
      {
        url: { type: String },
        alt: { type: String },
      },
    ],
    detailImage: { type: String },
    category: { type: String, required: true, index: true },
    categories: [{ type: String, index: true }],
    subcategory: { type: String, index: true },
    subcategories: [{ type: String, index: true }],
    description: { type: String, required: true },
    longDescription: { type: String },
    ingredients: { type: String },
    allergens: { type: String },
    flavors: [{ type: String }],
    stock: { type: Number },
    weight: { type: String },
    defaultWeight: { type: String },
    weights: [
      {
        label: { type: String, required: true },
        price: { type: Number, required: true },
      },
    ],
    ratings: { type: Number },
    numOfReviews: { type: Number },
    featured: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    isBestSeller: { type: Boolean, default: false, index: true },
    isTrending: { type: Boolean, default: false, index: true },
    customizable: { type: Boolean, default: false },
    sameDayDelivery: { type: Boolean, default: false, index: true },
    hasBaseAndCream: { type: Boolean, default: true },
    tags: [{ type: String }],
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
