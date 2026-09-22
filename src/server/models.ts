import { Schema, model, models, type InferSchemaType } from "mongoose";


export const ROLES = [
    "patient",
    "provider",
    "regulator",
    "er_specialist",
    "admin"
] as const;

const userSchema = new Schema(
    {
        id: {type: Number, required: true},
        name: {type: String, required: true},
        address: {type: String, required: true},
        didURI: {type: String, required: true},
        role: {type: String, enum: ROLES, }
    }, 
    {collection: 'user'}
);

export type UserDoc = InferSchemaType<typeof userSchema>;

export const UserModel = models.UserModel ?? model("UserModel", userSchema);