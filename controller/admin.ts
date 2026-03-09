import Admin from "../models/admin.js";
import { AdminType } from "../types/index.js";


export const addAdmin = async (adminData: AdminType) => {
    try {
        let newAdmin = new Admin(adminData);
        await newAdmin.save();

        return newAdmin;
    } catch (err) {
        throw err;
    }
}

export const creteTheBigBossAdminIfNotExist = async () => {
    try {
        const admin = await Admin.findOne({ type: "bigBoss" })
        if (!admin) {
            await addAdmin({
                fullName: "Wassim Ben Salah",
                password: "admin123",
                token: "538942",
                isVerified: true,
                type: "bigBoss",
                accesses: [
                    "Open Analytics page",
                    "Open Orders page",
                    "Open Products page",
                    "Open People page",
                    "Open notifications page",
                    "Open setting page",
                    "Edit Prices",
                    "Manage Staff",
                    "Manage Products",
                    "View Clients data",
                    "View Admins data",
                    "View delivery worker data",
                    "Control Settings",
                    "Manage Orders",
                    "Manage Collections"
                ],
            })
        }
    } catch (err) {
        throw err;
    }
}

export const getAdminById = async (id: string) => {
    try {
        const admin = await Admin.findOne({ _id: id });
        return admin;
    } catch (err) {
        throw err;
    }
}

export const getAdminByEmail = async (email: string) => {
    try {
        const admin = await Admin.findOne({ email });
        return admin;
    } catch (err) {
        throw err;
    }
}

export const getAdminByToken = async (token: string) => {
    try {
        const admin = await Admin.findOne({ token });

        console.log({ admin, token });


        return admin;
    } catch (err) {
        throw err;
    }
}

export const getAdminsByAccesses = async (access: string[]) => {
    try {
        const admins = await Admin.find({
            accesses: { $in: access }
        });

        return admins;
    } catch (err) {
        throw err;
    }
}

export const getAdminByFullName = async (fullName: string) => {
    try {
        const admin = await Admin.findOne({ fullName });
        return admin;
    } catch (err) {
        throw err;
    }
}

export const getAllAdmins = async () => {
    const admins = await Admin.find({})
        .sort({ createdAt: -1 });

    return admins;
};

export const validateAdminLogin = async (fullName: string, password: string) => {
    try {
        const admin = await Admin.findOne({ fullName, password });
        return admin;
    } catch (err) {
        throw err;
    }
}

export const updateAdmin = async (updatedRow: AdminType) => {
    try {
        if (!updatedRow._id) {
            throw new Error("Missing admin ID");
        }

        const updatedAdmin = await Admin.findByIdAndUpdate(
            updatedRow._id,
            {
                $set: {
                    ...updatedRow,
                },
            },
            { new: true }
        );

        return updatedAdmin;
    } catch (err) {
        throw err;
    }
};

export const deleteAdmin = async (adminId: string) => {
    try {
        const deletedAdmin = await Admin.findByIdAndDelete(adminId);
        return deletedAdmin;
    } catch (err) {
        throw err;
    }
};
