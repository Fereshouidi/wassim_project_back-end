import express from 'express';
import { addClient, getClientByDeviceId, getClientByEmail, getClientByFullName, getClientById, getClientByToken, getClients, getClientsDetailsByDateRange, getNewClientsAnalytics, getUsersListLogic, updateClient, validateClientLogin } from '../controller/client.js';
import { getOwnerInfo } from '../controller/ownerInfo.js';
import { ClientType, OwnerInfoType } from '../types/index.js';
import { sendVerificationTokenByEmail } from '../lib/emailVerification.js';
import Client from '../models/client.js';
import Admin from '../models/admin.js';
import { getCartByClient, getCartContentByClient } from '../controller/cart.js';
import { getLikesByClient } from '../controller/like.js';
import { getOrdersByClient } from '../controller/order.js';
import { getChatsByClient } from '../controller/chat.js';
import { getEvaluationsByClient } from '../controller/evaluation.js';
// import { sendVerificationCode } from '../lib/index.js';

export const addClient_ = async (req: express.Request, res: express.Response) => {

    try {

        const { clientData, deviceId } = req.body;

        let newClient = null;

        if (deviceId) {
            const existingClient = await getClientByDeviceId(deviceId);

            if (existingClient && existingClient._id) {
                const dataToUpdate = {
                    ...clientData,
                    _id: existingClient._id,
                    deviceId: deviceId
                };

                const updatedClient = await updateClient(dataToUpdate);

                return res.status(200).json({
                    newClient: updatedClient
                });
            }
        }

        const token = Math.floor(100000 + Math.random() * 900000);

        const clientData_ = { ...clientData, token }


        newClient = await addClient(clientData_);

        res.status(201).json({
            newClient
        })

    } catch (err: any) {

        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: err.message });
    }
}

export const getClientByEmail_ = async (req: express.Request, res: express.Response) => {
    try {

        const { email } = req.query;


        const client = await getClientByEmail(email as string);

        if (!client) return res.status(404).json({
            message: "there is no client with this email !"
        })

        res.status(200).json({
            client
        })

    } catch (err: any) {

        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: err.message });
    }
}

export const getClientByToken_ = async (req: express.Request, res: express.Response) => {
    try {
        const token = req.query.token;
        const deviceId = req.query.deviceId as string;

        console.log({ token, deviceId });



        let client = null;

        if (token && token !== "undefined" && token !== "null") {
            client = await getClientByToken(Number(token));
        }

        if (!client && deviceId) {
            client = await getClientByDeviceId(deviceId);
        }

        // if (client && client.deviceId && !client.password) {
        //     client = await addClient({ deviceId } as ClientType);
        // }

        console.log({client});
        

        if (!client) {
            if (!deviceId) {
                return res.status(400).json({ message: "DeviceId is required to create a new client" });
            }
            client = await addClient({ deviceId } as ClientType);
        }

        // Update client's deviceId if they opened an old account on a new device
        if (client && deviceId && client.deviceId !== deviceId) {
            // Optional: you can update the device in the database here to link them
            // await updateClientDeviceId(client._id, deviceId);
        }

        res.status(200).json({ client });

    } catch (err: any) {

        if (err.message?.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
}

export const getClientById_ = async (req: express.Request, res: express.Response) => {
    try {
        // Receive ID from query params (since you used params in axios.get)
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Client ID is required"
            });
        }

        // Use the function you provided previously
        const client = await getClientById(id as string);

        if (!client) {
            return res.status(404).json({
                success: false,
                message: "Client not found"
            });
        }

        // Return data successfully
        return res.status(200).json({
            success: true,
            client: client
        });

    } catch (err) {
        console.error("Backend Error:", err);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

export const getClientInfoById_ = async (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ success: false, message: "Client ID is required" });
        }

        // Fetch fundamental client data (Parallel Execution)
        // Chat is intentionally omitted here to avoid blocking page load for large histories
        const [client, purchasesInCart, likes, orders, evaluations] = await Promise.all([
            getClientById(id as string),
            getCartContentByClient(id as string),
            getLikesByClient(id as string),
            getOrdersByClient(id as string),
            getEvaluationsByClient(id as string)
        ]);

        if (!client) {
            return res.status(404).json({ success: false, message: "Client not found" });
        }


        // Return data successfully
        return res.status(200).json({
            success: true,
            client,
            purchasesInCart,
            likes,
            orders,
            evaluations
        });

    } catch (err) {
        console.error("Backend Error:", err);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

export const getNewClientsCountByDateRange_ = async (req: express.Request, res: express.Response) => {
    try {
        const { from, to } = req.query;

        if (!from || !to) {
            return res.status(400).json({ message: "Parameters 'from' and 'to' are required" });
        }

        const result = await getNewClientsAnalytics(Number(from), Number(to));

        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getInationalUsers_ = async (req: express.Request, res: express.Response) => {
    try {
        // Execute all queries in parallel for speed
        const [lastClients, allAdmins, totalClients, totalAdmins] = await Promise.all([
            // 1. Fetch last 10 clients
            Client.find({})
                .select('-password -token')
                .sort({ createdAt: -1 })
                .limit(10),

            // 2. Fetch all admins
            Admin.find({})
                .select('-password -token')
                .sort({ createdAt: -1 }),

            // 3. Count total number of clients
            Client.countDocuments({}),

            // 4. Count total number of admins
            Admin.countDocuments({})
        ]);

        // Send data in one organized object
        return res.status(200).json({
            clients: {
                data: lastClients,
                total: totalClients
            },
            admins: {
                data: allAdmins,
                total: totalAdmins
            }
        });

    } catch (error: any) {
        return res.status(500).json({
            message: "Error fetching initial users data",
            error: error.message
        });
    }
};

// Function that uses req and res
export const getClients_ = async (req: express.Request, res: express.Response) => {
    try {

        const { limit, skip } = req.query;

        if (!limit || !skip) return;
        // Call normal function
        const { clients, total } = await getClients(
            limit as unknown as number,
            skip as unknown as number
        );

        // Send response to Frontend
        res.status(200).json({
            success: true,
            data: clients,
            total: total
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

export const validateClientLogin_ = async (req: express.Request, res: express.Response) => {

    try {

        const { fullName, password, deviceId } = req.query;

        if (!fullName || !password) return res.status(404).json({
            message: "fullName and password are required !"
        })

        const client = await getClientByFullName(fullName as string);

        // const client = await validateClientLogin(fullName as string, password as string);

        if (!client) {

            return res.status(404).json({
                message: "client not found !"
            });

        }

        await Client.findByIdAndUpdate(client._id, { deviceId: deviceId })

        if (client?.password != password) {

            return res.status(401).json({
                client,
                message: "wrong password !"
            });

        }

        res.status(200).json({
            client
        })

    } catch (err: any) {

        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: err.message });
    }
}

export const logoutClient_ = async (req: express.Request, res: express.Response) => {
    try {
        const { _id } = req.query;

        if (!_id) {
            return res.status(400).json({
                message: "_id is required to logout!"
            });
        }

        console.log({ _id });


        // Find the client and clear their session-related data
        const client = await Client.findOneAndUpdate(
            { _id: _id as string },
            {
                $set: {
                    token: "",
                    deviceId: ""
                }
            },
            { new: true }
        );

        console.log({ client });

        if (!client) {
            return res.status(404).json({
                message: "Client not found!"
            });
        }

        res.status(200).json({
            success: true,
            message: "Logged out successfully."
        });

    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export const verificateClient_ = async (req: express.Request, res: express.Response) => {
    try {

        const { clientId, lang } = req.body;



        if (!clientId) return res.status(404).json({ error: "clientId is required for the verifications !" });

        const client = await getClientById(clientId as string) as unknown as ClientType;
        const owner = await getOwnerInfo() as unknown as OwnerInfoType;

        if (!owner.contact?.email || !owner.contact?.mailPassword || !client?.email) throw "owner mmail, mailPassword and clientEmail are required to send the verification code !";

        const verificationCode = await sendVerificationTokenByEmail(
            owner.contact?.email,
            client.email,
            owner.contact?.mailPassword,
            (lang === 'en' ? 'en' : 'fr'),
            'client'
        );



        const clientWithNewToken = await updateClient({
            _id: clientId,
            token: verificationCode.code.toString()
        } as ClientType);

        return res.status(200).json({
            message: "the client token has been updated successfully!"
        })

    } catch (err: any) {

        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: err.message });
    }
}

export const validateClient_ = async (req: express.Request, res: express.Response) => {
    try {

        const { token } = req.body;


        if (!token) return res.status(404).json({ error: "token is required for the verifications !" });

        const client = await getClientByToken(token) as unknown as ClientType;

        if (!client) return res.status(404).json({
            message: "the token is wrong !"
        })

        return res.status(200).json({ client })


    } catch (err: any) {

        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: err.message });
    }
}

export const updateClient_ = async (req: express.Request, res: express.Response) => {

    try {

        const { updatedClientData, lang } = req.body;


        if (!updatedClientData || !updatedClientData._id) {
            return res.status(400).json({ message: "Missing client data or ID" });
        }

        const clientOldData = await getClientById(updatedClientData._id);

        if (!clientOldData) {
            return res.status(404).json({ message: "Client not found" });
        }

        const owner = await getOwnerInfo() as unknown as OwnerInfoType;

        if (!owner?.contact?.email || !owner?.contact?.mailPassword) {
            return res.status(500).json({
                message: "Email configuration is missing. Cannot send verification code."
            });
        }

        let updatedClient: ClientType;

        if (updatedClientData.email && updatedClientData.email !== clientOldData.email) {

            try {
                const verificationCode = await sendVerificationTokenByEmail(
                    owner.contact.email,
                    updatedClientData.email,
                    owner.contact.mailPassword,
                    (lang === 'en' ? 'en' : 'fr'),
                    'client'
                );

                const dataToSave = {
                    ...updatedClientData,

                    email: updatedClientData.email,
                    dateOfBirth: updatedClientData.dateOfBirth,
                    pendingEmail: updatedClientData.email,
                    isVerified: false,
                    token: verificationCode.code.toString(),
                    emailVerified: false
                } as ClientType;

                updatedClient = await updateClient(dataToSave) as unknown as ClientType;

            } catch (emailErr: any) {
                return res.status(500).json({
                    message: "Failed to send verification email. Please try again."
                });
            }

        } else {
            updatedClient = await updateClient(updatedClientData) as unknown as ClientType;
        }

        if (!updatedClient) {
            return res.status(500).json({ message: "Failed to update client" });
        }

        res.status(200).json({
            success: true,
            message: updatedClientData.email !== clientOldData.email
                ? "Update saved. Please check your new email to verify the change."
                : "Client updated successfully",
            updatedClient
        });

    } catch (err: any) {

        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern || {})[0];
            return res.status(409).json({
                message: `${field === 'email' ? 'Email' : 'Phone number'} already exists`
            });
        }

        if (err.message?.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        if (err.message?.includes("not found")) {
            return res.status(404).json({ message: err.message });
        }

        res.status(500).json({
            message: err.message || "An error occurred while updating client"
        });
    }
}

export const getClientsDetailsByDateRange_ = async (req: express.Request, res: express.Response) => {
    try {
        const { from, to, limit, skip } = req.query;
        if (!from || !to) {
            return res.status(400).json({ message: "Dates are required" });
        }
        const clients = await getClientsDetailsByDateRange(
            Number(from),
            Number(to),
            limit ? Number(limit) : 5,
            skip ? Number(skip) : 0
        );
        return res.status(200).json(clients);
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};
