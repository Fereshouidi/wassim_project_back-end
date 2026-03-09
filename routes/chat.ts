import express from 'express';
import { getAnswerFromAi, getChatHistory_ } from '../midCondroller/chat.js';
const router = express.Router();


router.post('/getAnswerFromAi', async (req, res) => {
    await getAnswerFromAi(req, res);
})

router.post('/getChatHistory', async (req, res) => {
    await getChatHistory_(req, res);
})



export default router;