import { Schema } from "mongoose";
import { getModel } from "./helpers";

const patientProfileSchema = new Schema({
  address: { type: String, required: true },
  name: { type: String, required: true },
  dob: { type: String, required: true },
  bloodType: { type: String, required: true },
  allergies: { type: [String], required: true },
  emergencyContact: { type: String, required: true },
  primaryProvider: { type: String, required: true },
  insurance: { type: String, required: true },
});
patientProfileSchema.index({ address: 1 }, { unique: true });

export const PatientProfileModel = getModel("PatientProfile", patientProfileSchema);