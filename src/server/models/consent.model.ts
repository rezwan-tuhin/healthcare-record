import { Schema } from "mongoose";
import { getModel } from "./helpers";

const consentSchema = new Schema({
  patientAddress: { type: String, required: true },
  providerAddress: { type: String, required: true },
  providerName: { type: String, required: true },
  active: { type: Boolean, required: true },
  expiresAt: { type: Number, required: true },
  purpose: { type: String, required: true },
  grantedAt: { type: String, required: true },
});
consentSchema.index({ patientAddress: 1, providerAddress: 1 });

export const ConsentModel = getModel("Consent", consentSchema);