import express from 'express';
import { addSpecification_ } from '../midCondroller/specification.js';
const router = express.Router();



router.get('/addSpecification', async (req, res) => {
    await addSpecification_(req, res);
})



export default router;