import express from 'express';
import { addProduct_, getProductsByCollection_ } from '../midCondroller/product.js';
import { addPub_, getPub_ } from '../midCondroller/pub.js';
const router = express.Router();


router.post('/addPub', async (req, res) => {
    await addPub_(req, res);
})

router.get('/getPub', async (req, res) => {
    await getPub_(req, res);
})


export default router;