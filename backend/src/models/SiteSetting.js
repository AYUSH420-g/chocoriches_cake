import mongoose from "mongoose";

const siteSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: {
      type: String,
      default: "We are under maintenance. Please check back shortly.",
    },
    dailyCakeLimit: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const SiteSetting = mongoose.models.SiteSetting || mongoose.model("SiteSetting", siteSettingSchema);
