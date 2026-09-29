import { Schema } from "mongoose";
import { getModel } from "./helpers";

const emergencySchema = new Schema({
  patientAddress: { type: String, required: true },
  doctorAddress: { type: String, required: true },
  doctorName: { type: String, required: true },
  justification: { type: String, required: true },
  validUntil: { type: String, required: true },
  active: { type: Boolean, required: true },
});
emergencySchema.index({ patientAddress: 1 });

export const EmergencyModel = getModel("EmergencyAccess", emergencySchema);