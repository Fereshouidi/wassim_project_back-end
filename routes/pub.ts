import express from 'express';
import { addProduct_, getProductsByCollection_ } from '../midCondroller/product.js';
import { addPub_, getPub_, updatePub_ } from '../midCondroller/pub.js';
import { uploadPubMiddleware } from '../lib/multer.js';
const router = express.Router();


router.post('/addPub', async (req, res) => {
    await addPub_(req, res);
})

router.get('/getPub', async (req, res) => {
    await getPub_(req, res);
})

// Pub Router
router.put('/updatePub', uploadPubMiddleware, async (req, res) => {
    await updatePub_(req, res);
});

export default router;