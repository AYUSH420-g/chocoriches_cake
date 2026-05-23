import mongoose from "mongoose";

const inquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    eventDate: { type: String },
    guestCount: { type: String },
    theme: { type: String },
    status: { type: String, default: "Received" },
  },
  { timestamps: true }
);

export const Inquiry = mongoose.models.Inquiry || mongoose.model("Inquiry", inquirySchema);
