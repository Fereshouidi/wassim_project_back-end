import express from 'express';
import { addProduct_, deleteProducts_, getAllProducts_, getBestSellers_, getFavoriteProductsByClient_, getMostProductExpensive_, getProductAnalytics_, getProductById_, getProductsByCollection_, getProductsBySearch_, hideProducts_, updateProduct_ } from '../midCondroller/product.js';
import { uploadProductMiddleware } from '../lib/multer.js';
const router = express.Router();


router.post(
    "/addProduct",
    uploadProductMiddleware,
    addProduct_
);

router.get('/getAllProducts', async (req, res) => {
    await getAllProducts_(req, res);
})

router.get('/getProductById', async (req, res) => {    
    await getProductById_(req, res);
})

router.get('/getProductAnalytics', async (req, res) => {
    await getProductAnalytics_(req, res);
})

router.get('/getProductsByCollection', async (req, res) => {
    await getProductsByCollection_(req, res);
})

router.post('/getProductsBySearch', async (req, res) => {
    await getProductsBySearch_(req, res);
})

router.get('/getMostProductExpensive', async (req, res) => {
    await getMostProductExpensive_(req, res);
})

router.get('/getBestSellers', async (req, res) => {
    await getBestSellers_(req, res);
})

router.get('/getFavoriteProductsByClient', async (req, res) => {
    await getFavoriteProductsByClient_(req, res);
})

router.put(
    "/updateProduct",
    uploadProductMiddleware,
    updateProduct_
);

router.put("/deleteProducts", async (req, res) => {
    await deleteProducts_(req, res);
})

router.put("/hideProducts", async (req, res) => {
    await hideProducts_(req, res);
})



export default router;