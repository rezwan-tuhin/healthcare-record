import { Schema } from "mongoose";
import { getModel } from "./helpers";

const providerSchema = new Schema({
  address: { type: String, required: true },
  name: { type: String, required: true },
  didURI: { type: String, required: true },
  registered: { type: Boolean, required: true },
  verified: { type: Boolean, required: true },
  erQualified: { type: Boolean, required: true },
  specialty: { type: String },
  licenseNumber: { type: String },
  hospital: { type: String },
});
providerSchema.index({ address: 1 }, { unique: true });

export const ProviderModel = getModel("Provider", providerSchema);