import { ObjectId } from "mongoose";

type language = {
    fr: string,
    en: string
}

export type MessageType = { role: string; content: string; }

export interface OwnerInfoType {
  _id?: string | ObjectId;
  name?: string;
  logo?: {
    dark?: string;
    light?: string;
  };
  socialMedia?: {
    platform?: string;
    icon?: string;
    link?: string;
  }[];
  contact?: {
    email?: string,
    mailPassword?: string
    phone?: number
  },
  homeCollections?: CollectionType[];
  topCollections?: CollectionType[];
  collectionsInSideBar?: CollectionType[]
  shippingCost?: number;
  aiPrompt?: string;
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

export type ProductType = {
  _id?: string | null;
  name: {
    fr: string | null;
    en: string | null;
  };
  price: number | null;
  thumbNail: string | null;
  images: [{
    uri: string,
    specification: string[] | SpecificationType[];
  }];
  description: {
    fr: string | null;
    en: string | null;
  };
  collections: string[];
  status: ProductStatus;
  stock: number | null;
  specifications: string[] | SpecificationType[];
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export type ProductStatus = "active" | "deleted" | "archived";
export type CollectionStatus = "active" | "deleted" | "archived";

export type SpecificationType = {
  _id?: string
  color?: string | null;
  size?: string | null;
  type?: string | null;
  price?: number | null;
  quantity?: number | null;
}

export interface CollectionType {
    _id?: ObjectId | string;
    name: language,
    thumbNail: string,
    type: "private" | "public"
    display: "vertical" | "horizontal",
    customizable?: "none" | "base" | "pendant"
}

export type FiltrationType = {
    price: {
        from: number
        to: number
    }
    collections: string[]
    colors: string[]
    types: string[]
    sizes: string[]

    sortBy: 'price' | 'name' | 'date'
    sortDirection: 'asc' | 'desc'
}

export interface PurchaseType {
  _id?: string | ObjectId;
  client: string | null;
  product: string | null;
  evaluation?: string | null;
  like?: boolean | null;
  quantity: number | null;
  specification?: SpecificationType;
  cart?: string | null;
  order?: string | null
  isCustomized?: boolean
  customizedCharms?: string[]
  status?: "viewed" | "inCart" | "ordered" | 'delivered'
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface OrderType {
  _id?: string;
  client?: string;
  address?: string
  email?: string
  phone?: number
  fullName?: string
  clientNote?: string
  orderNumber?: number
  shippingCoast?: number
  status?: "pending" | "delivered" | "failed";
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

// export interface OrderFormType {
//   _id?: string;
//   address?: string
//   clientNote?: string
//   status?: "pending" | "delivered" | "failed";
//   createdAt?: Date | null;
//   updatedAt?: Date | null;
// }

export interface CartType {
  _id?: string | ObjectId;
  client: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export type ClientType = {
  _id?: string
  fullName?: string
  email?: string
  token?: string;
  phone?:  Number
  password?: string
  address?: string
  dateOfBirth?: Date
  aiNote?: string
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export type AdminType = {
  _id?: string
  fullName?: string
  email?: string
  phone?:  Number
  password?: string
  token?: string
  isVerified?: boolean
  type?: AdminTypes
  aiNote?: string
  accesses?: string[]
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export type AdminTypes = "bigBoss" | "normalAdmin"


export type DeliveryWorkerType = {
  _id?: string
  fullName?: string
  email?: string
  phone?:  Number
  password?: string
  address?: string
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

interface WhatsAppSuccessResponse {
  messaging_product: string;
  contacts?: {
    input: string;
    wa_id: string;
  }[];
  messages?: {
    id: string;
  }[];
}

interface WhatsAppErrorResponse {
  error: {
    message: string;
    type: string;
    code: number;
    error_data?: {
      details: string;
    };
  };
}

export type WhatsAppResponse = WhatsAppSuccessResponse | WhatsAppErrorResponse;

export type LikeType = {
  client: string;
  product: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export type EvaluationType = {
  _id: string
  client?: string
  product?: string
  number?: number
  note?: string
}

export type History = {
    role: "user" | "model" | "system";
    parts: { text: string }[];
};

export type StreamResponse = {
    status: "thinking" | "searching" | "done";
    message?: string;
    data?: any;
};