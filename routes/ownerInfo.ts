import express from 'express';
import { getOwnerInfo_ } from '../midCondroller/ownerInfo.js';
const router = express.Router();


// router.post('/addProduct', async (req, res) => {
//     await addProduct_(req, res);
// })

router.get('/getOwnerInfo', async (req, res) => {
    await getOwnerInfo_(req, res);
})



export default router;