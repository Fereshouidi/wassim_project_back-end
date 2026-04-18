import Cart from "../models/cart.js";
import Purchase from "../models/purchase.js";
import { CartType } from "../types/index.js";


export const addCart = async (cartData: CartType) => {

    try {
        const newCart = new Cart(cartData);
        await newCart.save();
        return newCart;
    } catch (err) {
        throw err;
    }

}

export const getCartByClient = async (clientId: string) => {

    try {
        const cart = await Cart.findOne({ client: clientId }).lean();
        return cart;
    } catch (err) {
        throw err;
    }

}

export const getCartContentByClient = async (clientId: string) => {
    try {
        return await Purchase.find({
            client: clientId,
            status: "inCart"
        }).populate("product").populate("specification").lean();
    } catch (err) { return []; }
};