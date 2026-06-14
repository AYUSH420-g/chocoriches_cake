import mongoose from 'mongoose';

async function run() {
  await mongoose.connect('mongodb+srv://99ayushsoni_db_user:Riyush%3C3R@cluster0.ptxlnzz.mongodb.net/chocoriches?appName=Cluster0');
  const db = mongoose.connection.db;
  const products = await db.collection('products').find({}).toArray();
  let updatedCount = 0;

  for (const product of products) {
    let changed = false;
    let newWeights = [];
    let seenLabels = new Set();

    if (product.weights && Array.isArray(product.weights)) {
      for (let w of product.weights) {
        let label = (w.label || "").trim(); // Fix trailing spaces
        
        // Normalize common typos
        const lowerLabel = label.toLowerCase();
        if (lowerLabel === "300g" || lowerLabel === "300 gms" || lowerLabel === "300gm" || lowerLabel === "300 gm") {
          label = "300 gm";
        }

        if (!seenLabels.has(label)) {
          seenLabels.add(label);
          newWeights.push({ label, price: w.price, _id: w._id });
        } else {
          changed = true; // duplicate found!
        }
      }
      
      // If we normalized a label, we need to flag as changed
      if (JSON.stringify(newWeights.map(w => w.label)) !== JSON.stringify(product.weights.map(w => w.label))) {
        changed = true;
      }
    }

    if (changed) {
      console.log(`Fixing product: ${product.name} (ID: ${product._id})`);
      await db.collection('products').updateOne(
        { _id: product._id },
        { $set: { weights: newWeights } }
      );
      updatedCount++;
    }
  }

  console.log(`Fixed ${updatedCount} products with duplicate/malformed weights.`);
  process.exit(0);
}

run().catch(console.error);
