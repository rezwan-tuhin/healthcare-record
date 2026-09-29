import { Schema } from "mongoose";
import { getModel } from "./helpers";

const patientSchema = new Schema({
  address: { type: String, required: true },
  didURI: { type: String, required: true },
  registered: { type: Boolean, required: true },
  name: { type: String },
});
patientSchema.index({ address: 1 }, { unique: true });

export const PatientModel = getModel("Patient", patientSchema);