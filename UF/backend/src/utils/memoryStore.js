import {
  initialCartItems,
  initialOrders,
  products,
  profileUser,
} from "../data/seedData.js";

export const memory = {
  products: structuredClone(products),
  cartItems: structuredClone(initialCartItems),
  orders: structuredClone(initialOrders),
  users: [structuredClone(profileUser)],
  inquiries: [],
  categories: [],
  pincodes: [],
  blockedDates: [],
  setting: {
    key: "site",
    maintenanceMode: false,
    maintenanceMessage: "We are under maintenance. Please check back shortly.",
  },
};

export {
  initialCartItems,
  initialOrders,
  products,
  profileUser,
};
