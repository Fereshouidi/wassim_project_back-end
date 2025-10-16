import express from 'express';
import { addCollection_, getHomeCollections_, getHomeCollectionsWithProducts_, getPublicCollections_ } from '../midCondroller/collection.js';
const router = express.Router();


router.post('/addCollection', async (req, res) => {
    await addCollection_(req, res);
})

router.get('/getHomeCollectionsWithProducts', async (req, res) => {
    await getHomeCollectionsWithProducts_(req, res);
})

router.get('/homeCollections', async (req, res) => {
    await getHomeCollections_(req, res);
})

router.get('/getPublicCollections', async (req, res) => {
    await getPublicCollections_(req, res);
})








export default router;