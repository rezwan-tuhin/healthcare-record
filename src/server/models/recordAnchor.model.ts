import { Schema } from "mongoose";
import { getModel, RECORD_TYPES } from "./helpers";

const recordAnchorSchema = new Schema({
  patientAddress: { type: String, required: true },
  recordId: { type: String, required: true },
  recordHash: { type: String, required: true },
  pointer: { type: String, required: true },
  ipfsCid: { type: String, required: true },
  anchoredBy: { type: String, required: true },
  anchoredAt: { type: String, required: true },
  tombstoned: { type: Boolean, required: true },
  title: { type: String, required: true },
  recordType: { type: String, enum: RECORD_TYPES, required: true },
  date: { type: String, required: true },
  providerName: { type: String, required: true },
  hospital: { type: String, required: true },
  content: { type: Schema.Types.Mixed, default: {} },
  hashVerified: { type: Boolean, required: true },
  ipfsSimulated: { type: Boolean, default: false },
  fileName: { type: String },
});
recordAnchorSchema.index({ patientAddress: 1, recordId: 1 });

export const RecordAnchorModel = getModel("RecordAnchor", recordAnchorSchema);