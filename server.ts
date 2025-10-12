import express, { json } from 'express';
import conn from './connection.js';
import cors from 'cors';
import productRoute from './routes/product.js';
import CollectionRoute from './routes/collection.js';
import PubRoute from './routes/pub.js'

const port = process.env.PORT || 3001;

const app = express();

app.use(cors({
  origin: "*",
  credentials: true,
}));

app.use(json());
app.use("/api", productRoute);
app.use("/api", CollectionRoute);
app.use("/api", PubRoute);

conn();

app.get("/", (req, res) => {
  res.send("Server is working!");
  console.log("Server is working!");
  
});


app.listen( port, () => {
    console.log("server is working at the port : " + port);
})