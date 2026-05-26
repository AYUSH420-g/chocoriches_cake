import { isDatabaseConnected } from "../db.js";
import { Inquiry } from "../models/Inquiry.js";
import { memory } from "../utils/memoryStore.js";

export async function submitInquiry(req, res) {
  const inquiry = {
    name: req.body.name,
    email: req.body.email,
    eventDate: req.body.eventDate,
    guestCount: req.body.guestCount,
    theme: req.body.theme,
    status: "Received",
  };

  if (isDatabaseConnected()) {
    await Inquiry.create(inquiry);
  } else {
    memory.inquiries.push({ ...inquiry, id: memory.inquiries.length + 1 });
  }

  res.status(201).json(inquiry);
}
