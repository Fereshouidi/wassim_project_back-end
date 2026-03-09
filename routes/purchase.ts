import express from 'express';
import { addProduct_, getProductsByCollection_ } from '../midCondroller/product.js';
import { addPub_, getPub_ } from '../midCondroller/pub.js';
import { addPurchase_, deletePurchase_, getProfitsByDate_, getPurchaseByClientAndProduct_, getPurchaseById_, getPurchasesInCartByClient_, getTotalSalesByDateRange_, updatePurchase__, verifyClientPurchase_ } from '../midCondroller/Purchase.js';
const router = express.Router();


router.post('/addPurchase', async (req, res) => {
    await addPurchase_(req, res);
})

router.get('/getPurchaseByClientAndProduct', async (req, res) => {
    await getPurchaseByClientAndProduct_(req, res);
})

router.get('/getPurchasesInCartByClient', async (req, res) => {
    await getPurchasesInCartByClient_(req, res);
})

router.get('/getPurchaseById', async (req, res) => {
    await getPurchaseById_(req, res);
})

router.put('/updatePurchase', async (req, res) => {
    await updatePurchase__(req, res);
})

router.get('/verifyClientPurchase', async (req, res) => {
    await verifyClientPurchase_(req, res);
})

router.get('/getProfitsByDate', async (req, res) => {
    await getProfitsByDate_(req, res);
})

router.get('/getTotalSalesByDateRange', async (req, res) => {
    await getTotalSalesByDateRange_(req, res);
})

router.delete('/deletePurchase', async (req, res) => {
    await deletePurchase_(req, res);
})






export default router;