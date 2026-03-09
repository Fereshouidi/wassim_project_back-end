import express from 'express';
import { addDeliveryWorker_, getDeliveryWorker_ } from '../midCondroller/deliveryWorker.js';
const router = express.Router();


router.post('/addDeliveryWorker', async (req, res) => {
    await addDeliveryWorker_(req, res);
})

router.get('/getDeliveryWorker', async (req, res) => {
    await getDeliveryWorker_(req, res);
})




export default router;







