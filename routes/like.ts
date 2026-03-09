import express from 'express';
import { addClient_, getClientByToken_ } from '../midCondroller/client.js';
import { addLike_, deleteLike_, getLikeByClientAndProduct_ } from '../midCondroller/like.js';
const router = express.Router();


router.post('/addLike', async (req, res) => {
    await addLike_(req, res);
})

router.delete('/deleteLike', async (req, res) => {
    await deleteLike_(req, res);
})

router.get('/getLikeByClientAndProduct', async (req, res) => {
    await getLikeByClientAndProduct_(req, res);
})


export default router;







