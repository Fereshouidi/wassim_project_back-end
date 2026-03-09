import mongoose  from "mongoose";

const socialSchema = new mongoose.Schema({
    platform: String,
    icon: String
})


const ownerInfoSchema = new mongoose.Schema({
    name: { type: String },
    logo: {
        dark: { type: String },
        light: { type: String }
    },
    socialMedia: [
        {
            platform: String,
            icon: String,
            link: String
        }
    ],
    contact: {
        email: {
            type: String,
            default: ""
        },
        mailPassword: {
            type: String,
            default: ""
        },
        phone: {
            type: String,
            default: ""
        },
    },
    homeCollections: [
        { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Collection",
            default: []
        }
    ],
    topCollections: [
        { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Collection",
            default: []
        }    
    ],
    collectionsInSideBar: [
        { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Collection",
            default: []
        }
    ],
    shippingCost: {
        type: Number,
        default: 0
    },
    aiPrompt: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
});

const OwnerInfo = mongoose.model('OwnerInfo', ownerInfoSchema);
export default OwnerInfo;
