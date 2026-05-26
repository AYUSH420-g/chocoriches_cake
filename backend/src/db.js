import mongoose from "mongoose";

let connected = false;

export async function connectDatabase(uri) {
  if (!uri) {
    console.info("MONGODB_URI is not set. Using in-memory seeded data.");
    return false;
  }

  try {
    await mongoose.connect(uri);
    connected = true;
    console.info("MongoDB connected.");
    return true;
  } catch (error) {
    connected = false;
    console.warn("MongoDB connection failed. Using in-memory seeded data instead.");
    console.warn(error.message);
    return false;
  }
}

export function isDatabaseConnected() {
  return connected && mongoose.connection.readyState === 1;
}
