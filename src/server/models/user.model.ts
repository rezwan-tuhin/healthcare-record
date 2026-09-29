import { Schema } from "mongoose";
import { getModel, ROLES } from "./helpers";

const userSchema = new Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  didURI: { type: String, required: true },
  role: { type: String, enum: ROLES, required: true },
  initials: { type: String, required: true },
});
userSchema.index({ address: 1 }, { unique: true });
userSchema.index({ id: 1 }, { unique: true });

export const UserModel = getModel("User", userSchema);