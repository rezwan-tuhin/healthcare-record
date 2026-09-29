import { Schema } from "mongoose";
import { getModel } from "./helpers";

const providerProfileSchema = new Schema({
  address: { type: String, required: true },
  name: { type: String, required: true },
  specialty: { type: String, required: true },
  licenseNumber: { type: String, required: true },
  hospital: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, enum: ["provider", "er_specialist"], required: true },
});
providerProfileSchema.index({ address: 1 }, { unique: true });

export const ProviderProfileModel = getModel("ProviderProfile", providerProfileSchema);