import {
  initialOrders,
  products,
  profileUser,
} from "../data/seedData.js";

import { initialReviews } from "../data/seedData.js";

export const memory = {
  reviews: structuredClone(initialReviews),
  products: structuredClone(products),
  cartItems: [],
  orders: structuredClone(initialOrders),
  users: [structuredClone(profileUser)],
  inquiries: [],
  categories: [],
  subcategories: [],
  pincodes: [],
  blockedDates: [],
  setting: {
    key: "site",
    maintenanceMode: false,
    maintenanceMessage: "We are under maintenance. Please check back shortly.",
    dailyCakeLimit: 0,
    deliveryFee: 0,
  },
};

export {
  initialOrders,
  products,
  profileUser,
};
