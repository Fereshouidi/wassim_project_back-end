import mongoose  from "mongoose";

const ownerInfoSchema = new mongoose.Schema({

    name: {
        type: String
    },
    logo: {
        dark: {
            type: String
        },
        light: {
            type: String
        }
    },
    socialMedia: {
        facebook: {
            type: String
        },
        instagram: {
            type: String
        },
        gmail: {
            type: String
        },
    },
    homeCollections: {
        type: [ mongoose.Schema.Types.ObjectId ],
        ref: "Collection"
    }

}, {
    timestamps: true
})

const OwnerInfo = mongoose.model('ownerInfo', ownerInfoSchema);

export default OwnerInfo;