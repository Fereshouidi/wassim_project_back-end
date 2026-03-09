import express from 'express';
import { getCartByClient_ } from '../midCondroller/cart.js';
const router = express.Router();



router.get('/getCartByClient', async (req, res) => {
    await getCartByClient_(req, res);
})

export default router;

