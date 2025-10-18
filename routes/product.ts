import express from 'express';
import { addProduct_, getProductsByCollection_, getProductsBySearch_ } from '../midCondroller/product.js';
const router = express.Router();


router.post('/addProduct', async (req, res) => {
    await addProduct_(req, res);
})

router.get('/getProductsByCollection', async (req, res) => {
    await getProductsByCollection_(req, res);
})

router.get('/getProductsBySearch', async (req, res) => {
    await getProductsBySearch_(req, res);
})



export default router;