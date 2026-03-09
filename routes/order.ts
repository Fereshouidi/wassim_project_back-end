import express from 'express';
import { AddOrder__, getDailySalesByDateRange_, getInationalOrdeByClient_, getInationalOrderBatches__, getOrderById_, getOrdersByClientAndStatus_, getOrdersByStatus_, getOrdersCountByDateRange_, getOrdersDetailsByDateRange_, getOrderStatusCounts_, updateOrderStatus_ } from '../midCondroller/order.js';
const router = express.Router();


router.post('/addOrder', async (req, res) => {
    await AddOrder__(req, res);
})

router.get('/getOrderById', async (req, res) => {
    await getOrderById_(req, res);
})

router.get('/getInationalOrderBatches', async (req, res) => {
    await getInationalOrderBatches__(req, res);
})

router.get('/getInationalOrdeByClient', async (req, res) => {
    await getInationalOrdeByClient_(req, res);
})

router.get('/getOrdersByClientAndStatus', async (req, res) => {
    await getOrdersByClientAndStatus_(req, res);
})

router.get('/getOrdersByStatus', async (req, res) => {
    await getOrdersByStatus_(req, res);
})

router.get('/getOrderStatusCounts', async (req, res) => {
    await getOrderStatusCounts_(req, res);
})

router.put('/updateOrderStatus', async (req, res) => {
    await updateOrderStatus_(req, res);
})

router.get('/getOrdersCountByDateRange', async (req, res) => {
    await getOrdersCountByDateRange_(req, res);
})

router.get('/getOrdersDetailsByDateRange', async (req, res) => {
    await getOrdersDetailsByDateRange_(req, res);
})

router.get('/getDailySalesByDateRange', async (req, res) => {
    await getDailySalesByDateRange_(req, res);
})


export default router;








