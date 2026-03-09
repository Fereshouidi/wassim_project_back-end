import { sendVerificationTokenByEmail } from "../lib/emailVerification.js";
import Admin from "../models/admin.js";
import Client from "../models/client.js";
import OwnerInfo from "../models/ownerInfo.js";
import { ClientType, OwnerInfoType } from "../types/index.js";
import { addCart } from "./cart.js";
import { createNotification } from "./notification.js";

export const addClient = async (clientData: ClientType) => {

    try {

        let newClient = new Client(clientData);
        await newClient.save();

        await addCart({ client: newClient._id as unknown as string });

        await createNotification(
            "New Client Registered",
            `${clientData.fullName || 'A new client'} has registered.`,
            "new_client",
            newClient._id?.toString()
        );

        return newClient;
    } catch (err) {
        throw err;
    }

}

export const getClientById = async (id: string) => {

    try {
        const client = await Client.findOne({ _id: id })
        return client;
    } catch (err) {
        throw err;
    }

}

export const getClientByEmail = async (email: string) => {

    try {
        const client = await Client.findOne({ email })
        return client;
    } catch (err) {
        throw err;
    }

}

export const getClientByToken = async (token: number) => {

    try {
        const client = await Client.findOne({ token })
        return client;
    } catch (err) {
        throw err;
    }

}

export const getClients = async (limit: number, skip: number) => {
    // Fetch data from the clients model
    const clients = await Client.find({})
        .sort({ createdAt: -1 }) // Newest first
        .skip(skip)
        .limit(limit);

    // Get total count
    const total = await Client.countDocuments();

    return { clients, total };
};

export const getClientByDeviceId = async (deviceId: string) => {
    try {

        const client = await Client.findOne({ deviceId: deviceId })

        return client

    } catch (err) {
        throw err
    }
};

export const getClientByFullName = async (fullName: string) => {

    try {
        const client = await Client.findOne({ fullName });
        return client;
    } catch (err) {
        throw err;
    }

}

export const getUsersListLogic = async (
    target: 'admins' | 'delivery' | 'clients',
    search?: string
) => {
    try {
        let data;
        const searchFilter = search ? {
            $or: [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ]
        } : {};

        if (target === 'clients') {
            // Fetch from clients collection
            data = await Client.find(searchFilter)
                .select('-password -token')
                .sort({ createdAt: -1 });
        } else if (target === 'admins') {
            // Fetch admins who are not delivery workers (or all admins as needed)
            data = await Admin.find({ ...searchFilter, type: { $ne: 'deliveryWorker' } })
                .select('-password -token')
                .sort({ createdAt: -1 });
        } else if (target === 'delivery') {
            // Since there is only one worker, we search for him in the Admin Collection
            // or according to how you distinguish him (e.g., he has a specific permission)
            data = await Admin.find({ ...searchFilter, Access: { $in: ["Manage Orders"] } }) // Example for filtering
                .select('-password -token');
        }

        return data;
    } catch (error) {
        throw error;
    }
};

export const validateClientLogin = async (fullName: string, password: string) => {

    try {
        const client = await Client.findOne({ fullName, password })
        return client;
    } catch (err) {
        throw err;
    }

}

export const updateClient = async (updatedRow: ClientType) => {
    try {
        if (!updatedRow._id) {
            throw new Error("Missing client ID");
        }

        // Destructure to separate ID and metadata you DON'T want to update manually
        // We exclude createdAt and updatedAt to let Mongoose handle them
        const { _id, createdAt, updatedAt, ...allowedFields } = updatedRow;

        const updateData: any = {};

        // Loop through allowed fields to build the update object dynamically
        // This is cleaner than 10 separate 'if' statements
        Object.entries(allowedFields).forEach(([key, value]) => {
            if (value !== undefined && value !== "") {
                updateData[key] = value;
            }
        });

        const updatedClient = await Client.findByIdAndUpdate(
            _id,
            { $set: updateData },
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedClient) {
            throw new Error("Client not found");
        }

        return updatedClient;

    } catch (err: any) {
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern || {})[0];
            throw new Error(`${field === 'email' ? 'Email' : field} already exists`);
        }
        throw err;
    }
};

export const getNewClientsAnalytics = async (from: number, to: number) => {
    try {
        // 1. Set current period dates
        const currentFrom = new Date(Number(from));
        currentFrom.setHours(0, 0, 0, 0);

        const currentTo = new Date(Number(to));
        currentTo.setHours(23, 59, 59, 999);

        // 2. Calculate previous period for Trend
        const duration = currentTo.getTime() - currentFrom.getTime() + 1;
        const previousFrom = new Date(currentFrom.getTime() - duration);
        const previousTo = new Date(currentFrom.getTime() - 1);

        // 3. Fetch data (assuming the model is Client)
        const [currentCount, previousCount] = await Promise.all([
            Client.countDocuments({
                createdAt: { $gte: currentFrom, $lte: currentTo },
            }),
            Client.countDocuments({
                createdAt: { $gte: previousFrom, $lte: previousTo },
                role: 'client'
            })
        ]);

        // 4. Calculate Trend
        let trendValue = 0;
        if (previousCount > 0) {
            trendValue = ((currentCount - previousCount) / previousCount) * 100;
        } else {
            trendValue = currentCount > 0 ? 100 : 0;
        }

        return {
            totalClients: currentCount,
            trend: trendValue.toFixed(1)
        };
    } catch (error) {
        throw error;
    }
};












// export const verificateClient = async (clientId: string) => {
//     try {
//         const client = await Client.findOne({_id: clientId}) as ClientType;
//         const owner = await OwnerInfo.findOne() as OwnerInfoType;

//         if (!owner.contact?.email || !owner.contact?.mailPassword || !client.email) throw "owner mmail, mailPassword and clientEmail are required to send the verification code !";

//         const verificationCode = sendVerificationTokenByEmail(
//             owner.contact?.email, 
//             client.email, 
//             owner.contact?.mailPassword
//         );

//         const clientWithNewToken = await Client.findOneAndUpdate(
//             {_id: clientId},
//             {set: {token: verificationCode}},
//             {new: true}
//         )

//         return "the client token has been updated successfully!"

//     } catch (err) {
//         throw err;
//     }
// }

export const getClientsDetailsByDateRange = async (from: number, to: number, limit: number = 5, skip: number = 0) => {
    try {
        const start = new Date(Number(from));
        start.setHours(0, 0, 0, 0);
        const end = new Date(Number(to));
        end.setHours(23, 59, 59, 999);

        return await Client.find({
            createdAt: { $gte: start, $lte: end }
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
    } catch (err) {
        throw err;
    }
};

