import express from 'express';
import { addCollection_, deleteCollections_, getAllCollections_, getCollectionById_, getCollectionsByProduct_, getCollectionsInSideBar_, getHomeCollections_, getHomeCollectionsWithProducts_, getPublicCollections_, getSubCollections_, getTopCollections_, updateCollection_ } from '../midCondroller/collection.js';
import { uploadCollectionMiddleware } from '../lib/multer.js';
const router = express.Router();

router.post(
    "/addCollection",
    uploadCollectionMiddleware,
    addCollection_
);

router.get('/getSubCollections', async (req, res) => {
    await getSubCollections_(req, res);
})

router.get('/getCollectionById', async (req, res) => {
    await getCollectionById_(req, res);
})

router.get('/getHomeCollectionsWithProducts', async (req, res) => {
    await getHomeCollectionsWithProducts_(req, res);
})

router.get('/homeCollections', async (req, res) => {
    await getHomeCollections_(req, res);
})

router.get('/topCollections', async (req, res) => {
    await getTopCollections_(req, res);
})

router.get('/getPublicCollections', async (req, res) => {
    await getPublicCollections_(req, res);
})

router.get('/getAllCollections', async (req, res) => {
    await getAllCollections_(req, res);
})

router.get('/getCollectionsByProduct', async (req, res) => {
    await getCollectionsByProduct_(req, res);
})

router.get('/getCollectionsInSideBar', async (req, res) => {
    await getCollectionsInSideBar_(req, res);
})

router.put(
    "/updateCollection",
    uploadCollectionMiddleware,
    updateCollection_
);

router.put("/deleteCollections", async (req, res) => {
    await deleteCollections_(req, res);
});


export default router;