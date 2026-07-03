import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config();

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  longDescription: String,
  category: String
}, { strict: false });

const Product = mongoose.model("Product", productSchema);

const updates = {
  "6a23cb1df745858b092cfe63": { name: "Bride To Be Heart & Butterfly Cake", desc: "A beautiful white cake with pink hearts and a golden Bride To Be topper." },
  "6a23cbbdf745858b092cfe7f": { name: "Chocolate Flakes Number Cake", desc: "A custom chocolate number cake perfect for special birthdays." },
  "6a23ccdff745858b092cfea2": { name: "Boy or Girl Gender Reveal Cake", desc: "A two-tier gender reveal cake decorated with blue and pink balloons." },
  "6a23cd0df745858b092cfec2": { name: "Purple Galaxy Pearl Cake", desc: "A mesmerizing purple frosted cake dotted with edible white pearls." },
  "6a23cef0f745858b092cffc2": { name: "Pink Rose Floral Glaze Cake", desc: "An elegant pink glazed cake with a beautiful floral crescent." },
  "6a23cf45f745858b092cffde": { name: "Chocolate Anniversary Rosette Cake", desc: "Rich chocolate cake with frosting rosettes and an anniversary topper." },
  "6a23cff8f745858b092d0012": { name: "Chocolate Overload Birthday Cake", desc: "A chocolate lover's dream birthday cake loaded with treats on top." },
  "6a23d05bf745858b092d002e": { name: "Chocolate Drip Crescent Cake", desc: "A gorgeous chocolate drip cake with a crescent of frosting rosettes." },
  "6a23d0abf745858b092d004c": { name: "Dark Chocolate Mirror Glaze Cake", desc: "A sleek dark chocolate mirror glaze cake with delicate rose details." }
};

async function run() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required.");
  await mongoose.connect(process.env.MONGODB_URI);
  
  for (const [id, data] of Object.entries(updates)) {
    const p = await Product.findById(id);
    if (p) {
      p.name = data.name;
      p.description = data.desc;
      p.longDescription = `Celebrate your special occasion with our stunning ${data.name}. Freshly baked with premium ingredients for the ultimate indulgence.`;
      
      // Update alt tags in images array
      if (p.get('images') && Array.isArray(p.get('images'))) {
        const imgs = p.get('images');
        imgs.forEach(img => {
          img.alt = data.name;
        });
        p.set('images', imgs);
      }
      
      await p.save();
      console.log(`Updated ${id} to ${data.name}`);
    }
  }
  process.exit(0);
}
run();
