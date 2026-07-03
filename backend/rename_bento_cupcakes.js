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
  // Bento cakes
  "6a28413e8ec486f9bfb7ea9b": { name: "Heart Shaped Chocolate Glaze Bento", desc: "A beautiful chocolate heart-shaped bento cake to show your love." },
  "6a28415d8ec486f9bfb7eab3": { name: "Dabbu Happy Birthday Bento", desc: "A cute illustrated bento cake wishing a Happy Birthday." },
  "6a2845e78ec486f9bfb7ead4": { name: "Panda Hugs Bento Cake", desc: "Adorable bento cake featuring a loving panda hug illustration." },
  "6a28460e8ec486f9bfb7eaec": { name: "Bear Hugs Bento Cake", desc: "Sweet bento cake with a cute bear hug drawing." },
  "6a28462e8ec486f9bfb7eb04": { name: "Rainbow Clouds Birthday Bento", desc: "A bright and happy rainbow birthday bento cake." },
  "6a2846698ec486f9bfb7eb21": { name: "You Did It Graduation Bento", desc: "Celebrate their success with this cute graduation bento." },
  "6a2846908ec486f9bfb7eb39": { name: "Vitamin U Prescription Bento", desc: "A fun and quirky 'Vitamin U' prescription bento cake." },
  "6a2846b78ec486f9bfb7eb51": { name: "Saving Queen Piggy Bank Bento", desc: "The perfect bento cake for the 'Saving Queen' in your life." },
  "6a2846ea8ec486f9bfb7eb69": { name: "Missing Piece Red Velvet Bento", desc: "Red velvet bento with a sweet 'You're my missing piece' design." },
  "6a2847188ec486f9bfb7eb81": { name: "You & Me Forever Heart Bento", desc: "Heart-shaped bento cake with pink frosting and a couple illustration." },
  "6a28473d8ec486f9bfb7eb99": { name: "Tom & Jerry Love Bento", desc: "A nostalgic bento cake featuring Tom & Jerry." },
  "6a28475d8ec486f9bfb7ebb1": { name: "I Love You Mini Bento", desc: "A simple and sweet 'I Love You' message on a white bento cake." },

  // Cupcakes
  "6a2b2d826f3558162aafebc8": { name: "Double Chocolate Chip Cupcake", desc: "Rich chocolate frosting loaded with chocolate chips." },
  "6a2b2d846f3558162aafebcc": { name: "Cookies & Cream Oreo Cupcake", desc: "A classic chocolate cupcake topped with Oreo frosting." },
  "6a2b2d866f3558162aafebd0": { name: "Classic Red Velvet Cupcake", desc: "A soft red velvet cupcake with smooth vanilla frosting." },
  "6a2b2d886f3558162aafebd4": { name: "KitKat Crunch Cupcake", desc: "Chocolate cupcake topped with light brown frosting and a KitKat stick." }
};

async function run() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required.");
  await mongoose.connect(process.env.MONGODB_URI);
  
  for (const [id, data] of Object.entries(updates)) {
    const p = await Product.findById(id);
    if (p) {
      p.name = data.name;
      p.description = data.desc;
      p.longDescription = `Treat yourself to our freshly made ${data.name}. This is perfect for any occasion and is guaranteed to satisfy your sweet tooth!`;
      
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
