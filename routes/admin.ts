import express from 'express';
import {
    addAdmin_,
    getAdminByEmail_,
    getAdminById_,
    getAdminByToken_,
    getAdmins_,
    updateAdmin_,
    validateAdmin_,
    validateAdminLogin_,
    verificateAdmin_,
    deleteAdmin_
} from '../midCondroller/admin.js';

const router = express.Router();

router.post('/addAdmin', async (req, res) => {
    await addAdmin_(req, res);
});

router.get('/getAdminByEmail', async (req, res) => {
    await getAdminByEmail_(req, res);
});

router.get('/getAdminByToken', async (req, res) => {
    await getAdminByToken_(req, res);
});

router.get('/getAdminById', async (req, res) => {
    await getAdminById_(req, res);
});

router.get('/getAdmins', getAdmins_);

router.post('/validateAdminLogin', async (req, res) => {
    await validateAdminLogin_(req, res);
});

router.post('/verificateAdmin', async (req, res) => {
    await verificateAdmin_(req, res);
});

router.post('/validateAdmin', async (req, res) => {
    await validateAdmin_(req, res);
});

router.put('/updateAdmin', async (req, res) => {
    await updateAdmin_(req, res);
});

router.delete('/deleteAdmin', async (req, res) => {
    await deleteAdmin_(req, res);
});

export default router;