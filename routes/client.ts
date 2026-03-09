import express from 'express';
import { addClient_, getClientByEmail_, getClientById_, getClientByToken_, getClientInfoById_, getClients_, getClientsDetailsByDateRange_, getInationalUsers_, getNewClientsCountByDateRange_, logoutClient_, updateClient_, validateClient_, validateClientLogin_, verificateClient_ } from '../midCondroller/client.js';
const router = express.Router();


router.post('/addClient', async (req, res) => {
    await addClient_(req, res);
})

router.get('/getClientByEmail', async (req, res) => {
    await getClientByEmail_(req, res);
})

router.get('/getClientByToken', async (req, res) => {
    await getClientByToken_(req, res);
})

router.get('/getClientById', async (req, res) => {
    await getClientById_(req, res);
})

router.get('/getClientInfoById', async (req, res) => {
    await getClientInfoById_(req, res);
})

router.get('/validateClientLogin', async (req, res) => {
    await validateClientLogin_(req, res);
})

router.get('/logoutClient', async (req, res) => {
    await logoutClient_(req, res);
})

router.get('/getNewClientsCountByDateRange', async (req, res) => {
    await getNewClientsCountByDateRange_(req, res);
})

router.get('/getClientsDetailsByDateRange', async (req, res) => {
    await getClientsDetailsByDateRange_(req, res);
})

router.get('/getInationalUsers', async (req, res) => {
    await getInationalUsers_(req, res);
})

router.get('/getClients', async (req, res) => {
    await getClients_(req, res);
});

router.post('/verificateClient', async (req, res) => {
    await verificateClient_(req, res);
})

router.post('/validateClient', async (req, res) => {
    await validateClient_(req, res)
})

router.put('/updateClient', async (req, res) => {
    await updateClient_(req, res);
})





export default router;







