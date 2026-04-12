import express from 'express';
import { addAdmin, deleteAdmin, getAdminByEmail, getAdminByFullName, getAdminById, getAdminByToken, getAllAdmins, updateAdmin } from '../controller/admin.js';
import { getOwnerInfo } from '../controller/ownerInfo.js';
import { AdminType, OwnerInfoType } from '../types/index.js';
import { sendVerificationTokenByEmail } from '../lib/emailVerification.js';
import Admin from '../models/admin.js';

export const addAdmin_ = async (req: express.Request, res: express.Response) => {
    try {
        const { adminData } = req.body;

        const token = Math.floor(100000 + Math.random() * 900000);
        const adminData_ = { ...adminData, token };

        const newAdmin = await addAdmin(adminData_);

        res.status(201).json({ newAdmin });
    } catch (err: any) {
        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: err.message });
    }
}

export const getAdminByEmail_ = async (req: express.Request, res: express.Response) => {
    try {
        const { email } = req.query;
        const admin = await getAdminByEmail(email as string);

        if (!admin) return res.status(404).json({
            message: "there is no admin with this email !"
        });

        res.status(200).json({ admin });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
}

export const getAdminByToken_ = async (req: express.Request, res: express.Response) => {
    try {
        const { token } = req.query;
        const admin = await getAdminByToken(token as string);

        res.status(200).json({ admin });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
}

export const getAdminById_ = async (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.query; // Or req.params depending on your route setup

        if (!id) {
            return res.status(400).json({ message: "Admin ID is required" });
        }

        const admin = await getAdminById(id as string);

        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        res.status(200).json({ success: true, admin });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
}

export const getAdmins_ = async (req: express.Request, res: express.Response) => {
    try {
        // Call normal function to fetch data
        const admins = await getAllAdmins();

        // Send response to Frontend with total count
        res.status(200).json({
            success: true,
            data: admins,
            total: admins.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

export const validateAdminLogin_ = async (req: express.Request, res: express.Response) => {
    try {
        const { fullName, password, newDevice } = req.body;

        // Check for required basic login fields
        if (!fullName || !password) {
            return res.status(400).json({
                message: "fullName and password are required!"
            });
        }

        const admin = await getAdminByFullName(fullName as string);

        if (!admin) {
            return res.status(404).json({ message: "admin not found!" });
        }

        // 1. Verify password (the core requirement for login)
        if (admin.password !== password) {
            return res.status(401).json({
                message: "wrong password!"
            });
        }

        // 2. Update device list (DeviceId) if it's a new device
        // This is a background action to track admin devices
        let isUpdated = false;
        if (newDevice) {
            if (!Array.isArray(admin.devices)) {
                admin.devices = [];
            }

            if (!admin.devices.includes(newDevice)) {
                admin.devices.push(newDevice);
                isUpdated = true;
            }
        }

        // Save changes only if a new device was linked
        if (isUpdated) {
            await admin.save();
        }

        // Login successful due to name and password
        res.status(200).json({
            admin,
            message: "Login successful"
        });

    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
}

export const verificateAdmin_ = async (req: express.Request, res: express.Response) => {
    try {
        const { adminId, lang } = req.body;

        if (!adminId) return res.status(404).json({ error: "adminId is required for the verifications !" });

        const admin = await getAdminById(adminId as string) as unknown as AdminType;
        const owner = await getOwnerInfo() as unknown as OwnerInfoType;

        if (!owner.contact?.email || !owner.contact?.mailPassword || !admin?.email)
            throw "owner mail, mailPassword and adminEmail are required!";

        const verificationCode = await sendVerificationTokenByEmail(
            owner.contact?.email,
            admin.email,
            owner.contact?.mailPassword,
            (lang === 'en' ? 'en' : 'fr'),
            'admin'
        );

        await updateAdmin({ _id: adminId, token: verificationCode.code.toString() } as AdminType);

        return res.status(200).json({
            message: "the admin token has been updated successfully!"
        });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
}

export const validateAdmin_ = async (req: express.Request, res: express.Response) => {
    try {
        const { token } = req.body;

        if (!token) return res.status(404).json({ error: "token is required for the verifications !" });

        const admin = await getAdminByToken(token) as unknown as AdminType;

        if (!admin) return res.status(404).json({ message: "the token is wrong !" });

        return res.status(200).json({ admin });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
}

export const updateAdmin_ = async (req: express.Request, res: express.Response) => {
    try {
        const { updatedRow, lang, currentAdminId } = req.body;
        
        if (!updatedRow._id) {
            return res.status(400).json({ message: "Admin ID is required" });
        }

        if (!currentAdminId) {
            return res.status(401).json({ message: "Authentication required to perform this action" });
        }

        // Get current admin data for comparison
        const [prevAdminData, performingAdmin] = await Promise.all([
            getAdminById(updatedRow._id),
            getAdminById(currentAdminId)
        ]);

        if (!prevAdminData) {
            return res.status(404).json({ message: "Target Admin not found" });
        }

        if (!performingAdmin) {
            return res.status(404).json({ message: "Performing Admin not found" });
        }

        // --- Security Check: bigBoss can only be edited by another bigBoss ---
        if (prevAdminData.type === 'bigBoss' && performingAdmin.type !== 'bigBoss') {
            return res.status(403).json({ 
                success: false, 
                message: "Security violation: Master administrators can only be modified by other master administrators." 
            });
        }

        let verificationInfo = null;
        // Prepare update data and remove special handling keys
        let updateData: any = { ...updatedRow };
        delete updateData.newDevice;

        // Direct update for devices array (only when newDevice is provided)
        if (updatedRow.newDevice) {
            await Admin.findByIdAndUpdate(updatedRow._id, {
                $addToSet: { devices: updatedRow.newDevice }
            });
            // Important: Remove 'devices' from updateData to prevent overwriting the array 
            // with potentially stale data from the client in the next step.
            delete updateData.devices;
        }


        // 2. Email verification logic
        // Only trigger verification if the email has changed or if explicitly set to false
        const emailChanged = updatedRow.email && updatedRow.email !== prevAdminData.email;
        const explicitlyUnverified = updatedRow.isVerified === false;

        if (emailChanged || explicitlyUnverified) {
            const owner = await getOwnerInfo() as unknown as OwnerInfoType;
            const ownerEmail = owner.contact?.email ?? "";
            const ownerPass = owner.contact?.mailPassword ?? "";

            // Send verification code
            const { code } = sendVerificationTokenByEmail(
                ownerEmail,
                updatedRow.email || prevAdminData.email,
                ownerPass,
                (lang === 'en' ? 'en' : 'fr'),
                'admin'
            );

            // Update code in the object to be saved
            updateData.isVerified = false;
            updateData.token = code; // Optional: to save and match code

            verificationInfo = {
                sent: true,
                message: "Verification code sent to email."
            };
        }

        // 3. Execute final update for remaining data
        const updatedAdmin = await updateAdmin(updateData);

        if (!updatedAdmin) {
            return res.status(404).json({ message: "Admin update failed" });
        }

        res.status(200).json({
            success: true,
            message: !updatedRow.isVerified
                ? "Admin updated. Verification required."
                : "Admin updated successfully",
            updatedAdmin,
            verificationInfo
        });

    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteAdmin_ = async (req: express.Request, res: express.Response) => {
    try {
        const { id, currentAdminId } = req.query;

        if (!id) {
            return res.status(400).json({ message: "Admin ID is required" });
        }

        if (!currentAdminId) {
            return res.status(401).json({ message: "Authentication required to perform this action" });
        }

        const [targetAdmin, performingAdmin] = await Promise.all([
            getAdminById(id as string),
            getAdminById(currentAdminId as string)
        ]);

        if (!targetAdmin) {
            return res.status(404).json({ message: "Target Admin not found" });
        }

        if (!performingAdmin) {
            return res.status(404).json({ message: "Performing Admin not found" });
        }

        // --- Security Check: bigBoss can only be deleted by another bigBoss ---
        if (targetAdmin.type === 'bigBoss' && performingAdmin.type !== 'bigBoss') {
            return res.status(403).json({ 
                success: false, 
                message: "Security violation: Master administrators can only be deleted by other master administrators." 
            });
        }

        const deletedAdmin = await deleteAdmin(id as string);

        if (!deletedAdmin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        res.status(200).json({ success: true, message: "Admin deleted successfully" });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

