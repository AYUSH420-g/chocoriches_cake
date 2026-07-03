import mongoose from "mongoose";

const inquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    eventDate: { type: String, maxlength: 10 },
    guestCount: { type: String, maxlength: 20 },
    theme: { type: String, maxlength: 500 },
    status: { type: String, default: "Received" },
  },
  { timestamps: true }
);

export const Inquiry = mongoose.models.Inquiry || mongoose.model("Inquiry", inquirySchema);
