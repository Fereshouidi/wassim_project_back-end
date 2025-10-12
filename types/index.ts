import { ObjectId } from "mongoose";

type language = {
    fr: string,
    en: string
}

export interface OwnerInfoType {
    _id?: string | ObjectId;
    name?: string;
    logo?: {
        dark?: string;
        light?: string;
    };
    socialMedia?: {
        facebook?: string;
        instagram?: string;
        gmail?: string;
    };
    homeCollections?: CollectionType[]
    createdAt?: Date;
    updatedAt?: Date;
}

export interface PubType {
    _id: string | ObjectId;
    topBar?: {
        fr: string;
        en: string;
    };
    heroBanner?: {
        sm: string;
        md: string;
    };
    bottomBanner?: {
        sm: string;
        md: string;
    };
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ProductType {
    _id?: string | ObjectId;
    name: language;
    price: number;
    thumbNail: string;
    images?: string[];
    description?: string;
    category: string;
    stock?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface CollectionType {
    _id?: string | ObjectId;
    name: language,
    type: "private" | "public"
}
