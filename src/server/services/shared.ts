
import mongoose from "mongoose";
import { PatientModel, PatientProfileModel, PROJECTED_FIELDS } from "@/server/models";

export type Doc = Record<string, unknown>;

type MongoModel = mongoose.Model<any>;

export function makeInitials(name: string): string {
  const parts = (name.trim() || "?").split(/\s+/);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function makeRecordId(): string {
  return `0x${crypto.randomUUID().replace(/-/g, "")}`;
}

// export function makeIpfsCid(): string {
//   const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
//   let out = "Qm";
//   for (let i = 0; i < 44; i++) {
//     out += chars[Math.floor(Math.random() * chars.length)];
//   }
//   return out;
// }

export async function nextNumericId(model: MongoModel): Promise<number> {
  const last = (await model.findOne().sort({ id: -1 }).select("id").lean()) as
    | { id?: number }
    | null;
  return (last?.id ?? 0) + 1;
}

export function strip<T extends object>(doc: T): T {
  const { _id: _dropped, __v: _legacy, ...rest } = doc as T & {
    _id?: unknown;
    __v?: unknown;
  };
  void _dropped;
  void _legacy;
  return rest as T;
}

export async function patientName(address: string): Promise<string | undefined> {
  const prof = (await PatientProfileModel.findOne({ address })
    .select(PROJECTED_FIELDS)
    .lean()) as { name?: string } | null;
  if (prof?.name) return prof.name;
  const p = (await PatientModel.findOne({ address })
    .select(PROJECTED_FIELDS)
    .lean()) as { name?: string } | null;
  return p?.name ?? undefined;
}