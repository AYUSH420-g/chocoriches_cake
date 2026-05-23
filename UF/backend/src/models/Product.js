import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    image: { type: String, required: true },
    images: [
      {
        url: { type: String },
        alt: { type: String },
      },
    ],
    detailImage: { type: String },
    category: { type: String, required: true, index: true },
    description: { type: String, required: true },
    longDescription: { type: String },
    ingredients: { type: String },
    allergens: { type: String },
    flavors: [{ type: String }],
    stock: { type: Number },
    weight: { type: String },
    ratings: { type: Number },
    numOfReviews: { type: Number },
    featured: { type: Boolean, default: false, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    isBestSeller: { type: Boolean, default: false, index: true },
    isTrending: { type: Boolean, default: false, index: true },
    customizable: { type: Boolean, default: false },
    tags: [{ type: String }],
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
