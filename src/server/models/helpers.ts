/**
 * Shared model-layer helpers.
 *
 * `getModel` avoids re-creating a Mongoose model on hot reloads (SSR/dev). All
 * models are typed `Model<any>` because Mongoose's generic `Schema<T>` /
 * `model<T>` types decompile the checker pathologically slow (>5 min / OOM on
 * this machine); strong typing lives on the service boundaries in
 * `src/server/services/*`, which cast results to the `dummy-data.ts` shapes.
 *
 * eslint-disable @typescript-eslint/no-explicit-any is applied at the getModel
 * helper for the same reason.
 */
import { type Model, Schema, model, models } from "mongoose";

/** Mongo projection used on every read so API JSON stays stable. */
export const PROJECTED_FIELDS = "-_id -__v";

export const ROLES = [
  "patient",
  "provider",
  "regulator",
  "er_specialist",
  "admin",
] as const;

export const RECORD_TYPES = [
  "lab_report",
  "imaging",
  "prescription",
  "discharge_summary",
  "ecg",
  "allergy_panel",
  "vaccination",
] as const;

/* eslint-disable @typescript-eslint/no-explicit-any -- keep model typing
   monomorphic: generic Schema<T>/model<T> decompiles pathologically slow on
   this machine. The typed boundaries live in the service layer, which casts
   results to dummy-data shapes. */
export function getModel(name: string, schema: Schema): Model<any> {
  return (models[name] as Model<any> | undefined) ?? model(name, schema);
}