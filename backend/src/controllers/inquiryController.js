import { isDatabaseConnected } from "../db.js";
import { Inquiry } from "../models/Inquiry.js";
import { memory } from "../utils/memoryStore.js";
import { todayIso } from "../utils/formatters.js";

export async function submitInquiry(req, res) {
  const name = String(req.body.name || "").trim().slice(0, 100);
  const email = String(req.body.email || "").trim().toLowerCase().slice(0, 254);
  const eventDate = String(req.body.eventDate || "").trim().slice(0, 10);
  const guestCount = String(req.body.guestCount || "").trim().slice(0, 20);
  const theme = String(req.body.theme || "").trim().slice(0, 500);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ message: "A valid name and email are required." });
    return;
  }
  if (eventDate && (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate) || eventDate < todayIso())) {
    res.status(400).json({ message: "Please select a valid event date." });
    return;
  }

  const inquiry = {
    name,
    email,
    eventDate,
    guestCount,
    theme,
    status: "Received",
  };

  if (isDatabaseConnected()) {
    await Inquiry.create(inquiry);
  } else {
    memory.inquiries.push({ ...inquiry, id: memory.inquiries.length + 1 });
  }

  res.status(201).json(inquiry);
}
