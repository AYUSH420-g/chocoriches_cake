import { isDatabaseConnected } from "./src/db.js";
import { cakeCapacityStatus, orderedCakeCountForDate } from "./src/services/availabilityService.js";
import { Order } from "./src/models/Order.js";

async function run() {
  console.log("DB connected?", isDatabaseConnected());
  
  // mock order for today
  const order1 = { 
    id: "o1", date: "now", total: 100, status: "Processing", items: [{quantity: 5}], itemCount: 5,
    deliveryDate: new Date().toISOString().slice(0, 10) 
  };
  
  const order2 = { 
    id: "o2", date: "now", total: 100, status: "Processing", items: [{quantity: 1}], itemCount: 1,
    deliveryDate: "2026-07-25" 
  };
  
  // push to memory
  const { memory } = await import("./src/utils/memoryStore.js");
  memory.setting.dailyCakeLimit = 5;
  memory.orders.push(order1, order2);
  
  console.log("Count today:", await orderedCakeCountForDate(new Date().toISOString().slice(0, 10)));
  console.log("Count next month:", await orderedCakeCountForDate("2026-07-25"));
  
  console.log("Capacity today:", await cakeCapacityStatus(new Date().toISOString().slice(0, 10), 1, 0));
  console.log("Capacity next month:", await cakeCapacityStatus("2026-07-25", 1, 0));
}

run().catch(console.error);
