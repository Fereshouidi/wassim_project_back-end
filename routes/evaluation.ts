import express from 'express';
import { addEvaluation_, deleteEvaluationById_, getEvaluationByProduct_, updateEvaluationById_ } from '../midCondroller/evaluation.js';
const router = express.Router();



router.post('/addEvaluation', async (req, res) => {
    await addEvaluation_(req, res);
})

router.get('/getEvaluationByProduct', async (req, res) => {
    await getEvaluationByProduct_(req, res);
})

router.put('/updateEvaluationById', async (req, res) => {
    await updateEvaluationById_(req, res);
})

router.delete('/deleteEvaluationById', async (req, res) => {
    await deleteEvaluationById_(req, res);
})



export default router;

