import Purchase from "../models/purchase.js";
import { SpecificationType } from "../types/index.js";
import Specification from '../models/specification.js';


export const addSpecification = async (specificationData: SpecificationType) => {

    try {
        const newSpecification = new Specification(specificationData);
        await newSpecification.save();
        return newSpecification;
    } catch (err) {
        throw err;
    }

}

// shouldn't be used 

// export const updateSpecification = async (updatedData: SpecificationType) => {

//     try {
//         const updatedSpecification = await Specification.findByIdAndUpdate(
//             updatedData._id,
//             updatedData,
//             { new: true }
//         );
//         return updatedSpecification;

//     } catch (err) {
//         throw err;
//     }

// }

export const deleteSpecification = async (id: string) => {

    try {
        await Specification.findOneAndDelete({_id: id});
        return "Specification deleted successfully";
    } catch (err) {
        throw err;
    }
}