process.stdout.write("Test Output via STDOUT\n");
import 'dotenv/config';
import express, { json } from 'express';
import conn from './connection.js';
import cors from 'cors';
import productRoute from './routes/product.js';
import CollectionRoute from './routes/collection.js';
import PubRoute from './routes/pub.js';
import OwnerRoute from './routes/ownerInfo.js';
import ClientRoute from './routes/client.js';
import PurchaseRoute from './routes/purchase.js';
import CartRoute from './routes/cart.js';
import SpecificationRoute from './routes/specification.js';
import OrderRoute from './routes/order.js';
import LikeRoute from "./routes/like.js";
import DeliveryWorkerRoute from "./routes/deliveryWorker.js";
import EvaluationRoute from "./routes/evaluation.js";
import AdminRoute from "./routes/admin.js";
import AiRoute from "./routes/chat.js";
import NotificationRoute from "./routes/notification.js";
import { creteTheBigBossAdminIfNotExist } from './controller/admin.js';
import { createDefaultCustomizerCollections } from './controller/collection.js';



const port = process.env.PORT || 3001;

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', JSON.stringify(reason, null, 2));
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  if (err instanceof Error) {
    console.error(err.stack);
  } else {
    console.error('Non-Error object caught:', JSON.stringify(err, null, 2));
  }
});

const app = express();
// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"]
//   }
// });

app.use(cors({
  origin: "*",
  credentials: true,
}));


app.use(json());
app.use("/api", productRoute);
app.use("/api", CollectionRoute);
app.use("/api", PubRoute);
app.use('/api', OwnerRoute);
app.use('/api', ClientRoute);
app.use('/api', PurchaseRoute);
app.use('/api', CartRoute);
app.use('/api', SpecificationRoute);
app.use('/api', LikeRoute);
app.use('/api', OrderRoute);
app.use('/api', DeliveryWorkerRoute);
app.use('/api', AdminRoute);
app.use('/api', EvaluationRoute);
app.use('/api', AiRoute);
app.use('/api', NotificationRoute);

await conn();
// registerSocketHandlers(io);

app.get("/", (req, res) => {
  res.send("Server is working!");
  console.log("aaaaaaaaaaaaa");
});
console.log('hhhhh');


try {
  await creteTheBigBossAdminIfNotExist();
  await createDefaultCustomizerCollections();
} catch (err) {
  console.error("Failed to initialize collections/admin:", err);
}

console.log("aaaaaaaa");

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// app.listen( port, () => {
// })