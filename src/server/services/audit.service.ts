import { connectToDatabase } from "../connection";
import { nextNumericId } from "./shared";
import { AuditModel, PROJECTED_FIELDS } from "@/server/models";
import type { AuditEntry } from "@/lib/dummy-data";
import type { AuditActor } from "@/server/db-types";

export async function appendAudit(
  actor: AuditActor | undefined,
  action: string,
  target: string,
  details: string,
): Promise<void> {
  const id = await nextNumericId(AuditModel);
  await AuditModel.create({
    id,
    actorName: actor?.name ?? "System",
    actorRole: actor?.role ?? "Admin",
    action,
    target,
    timestamp: new Date().toISOString(),
    details,
  });
}

export async function listAudit(): Promise<AuditEntry[]> {
  await connectToDatabase();
  return (await AuditModel.find()
    .select(PROJECTED_FIELDS)
    .sort({ id: -1 })
    .lean()) as unknown as AuditEntry[];
}