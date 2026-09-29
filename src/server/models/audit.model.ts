import { Schema } from "mongoose";
import { getModel } from "./helpers";

const auditSchema = new Schema({
  id: { type: Number, required: true },
  actorName: { type: String, required: true },
  actorRole: { type: String, required: true },
  action: { type: String, required: true },
  target: { type: String, required: true },
  timestamp: { type: String, required: true },
  details: { type: String, required: true },
});
auditSchema.index({ id: 1 }, { unique: true });

export const AuditModel = getModel("Audit", auditSchema);