import express from 'express';
import { getOwnerInfo_, updateOwnerInfo_ } from '../midCondroller/ownerInfo.js';
import { updateOwnerMiddleware, uploadPubMiddleware } from '../lib/multer.js';
const router = express.Router();


// router.post('/addProduct', async (req, res) => {
//     await addProduct_(req, res);
// })

router.get('/getOwnerInfo', async (req, res) => {
    await getOwnerInfo_(req, res);
})

// router.put('/updateOwnerInfo', async (req, res) => {
//     await updateOwnerInfo_(req, res);
// })

router.put('/updateOwnerInfo', updateOwnerMiddleware, updateOwnerInfo_);



export default router;