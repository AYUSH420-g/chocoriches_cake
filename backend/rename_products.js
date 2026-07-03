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
  "6a2847808ec486f9bfb7ebc9": { name: "Caramel Butterscotch Bliss", desc: "A heavenly blend of rich caramel and crunchy butterscotch bites." },
  "6a2847ac8ec486f9bfb7ebe1": { name: "Golden Hazelnut Praline", desc: "Premium roasted hazelnuts layered with smooth praline cream." },
  "6a2847f78ec486f9bfb7ec05": { name: "Raspberry White Choco Truffle", desc: "Delicate white chocolate infused with tart raspberry coulis." },
  "6a28481b8ec486f9bfb7ec1d": { name: "Mocha Espresso Drip Cake", desc: "Rich espresso-infused sponge with velvety mocha buttercream." },
  "6a2848568ec486f9bfb7ec35": { name: "Pistachio Rosewater Delight", desc: "An elegant fusion of crushed pistachios and sweet rosewater." },
  "6a2848778ec486f9bfb7ec4d": { name: "Midnight Dark Choco Truffle", desc: "Decadent dark chocolate ganache over a moist cocoa sponge." },
  "6a2848a18ec486f9bfb7ec65": { name: "Lemon Blueberry Zest Cake", desc: "Zesty lemon sponge loaded with fresh wild blueberries." },
  
  "6a2b2d826f3558162aafebc8": { name: "Classic Vanilla Swirl Cupcake", desc: "Light and fluffy vanilla cupcake topped with rich buttercream." },
  "6a2b2d846f3558162aafebcc": { name: "Rich Chocolate Fudge Cupcake", desc: "Intense chocolate fudge cupcake for the ultimate indulgence." },
  "6a2b2d866f3558162aafebd0": { name: "Strawberry Bliss Cupcake", desc: "Fresh strawberry cupcake frosted with berry-infused cream." },
  "6a2b2d886f3558162aafebd4": { name: "Red Velvet Velvet Cupcake", desc: "Classic red velvet base with our signature cream cheese frosting." },
  
  "6a2b2e6c9e41e7a71ff94e8f": { name: "Decadent Choco Mousse Jar", desc: "Layers of airy chocolate mousse and crushed cookies in a jar." },
  "6a2b2e6d9e41e7a71ff94e93": { name: "Red Velvet Layered Jar", desc: "Beautiful layers of red velvet sponge and sweet cream cheese." },
  "6a2b2e709e41e7a71ff94e97": { name: "Lotus Biscoff Delight Jar", desc: "Crushed Lotus Biscoff cookies layered with creamy caramel." },
  "6a2b2e719e41e7a71ff94e9b": { name: "Blueberry Cheesecake Jar", desc: "No-bake cheesecake with a rich and tangy blueberry compote." }
};

async function run() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required.");
  await mongoose.connect(process.env.MONGODB_URI);
  
  for (const [id, data] of Object.entries(updates)) {
    const p = await Product.findById(id);
    if (p) {
      p.name = data.name;
      p.description = data.desc;
      p.longDescription = `Indulge in our freshly baked ${data.name}. Made with the finest premium ingredients, this ${p.category || 'cake'} is perfect for any occasion. Treat yourself or a loved one to this delightful dessert.`;
      
      // Remove any trailing "a", "b", "c" from alt tags in images array
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
