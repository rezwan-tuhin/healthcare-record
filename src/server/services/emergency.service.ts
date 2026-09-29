import { connectToDatabase } from "../connection";
import { patientName, strip, type Doc } from "./shared";
import { appendAudit } from "./audit.service";
import { trustEmergency } from "./chain";
import { EmergencyModel, PROJECTED_FIELDS } from "@/server/models";
import type { EmergencyAccess } from "@/lib/dummy-data";
import type {
  AuditActor,
  ExpireEmergencyInput,
  TriggerEmergencyInput,
} from "@/server/db-types";

export async function listEmergency(): Promise<Array<EmergencyAccess & { patientName?: string }>> {
  await connectToDatabase();
  const entries = await trustEmergency(
    (await EmergencyModel.find()
      .select(PROJECTED_FIELDS)
      .lean()) as unknown as EmergencyAccess[],
  );
  return Promise.all(
    entries.map(async (e) => ({
      ...e,
      patientName: (await patientName(e.patientAddress)) ?? e.patientAddress,
    })),
  );
}

export async function triggerEmergency(
  input: TriggerEmergencyInput,
  actor?: AuditActor,
): Promise<EmergencyAccess> {
  await connectToDatabase();
  const created = await EmergencyModel.create({
    patientAddress: input.patientAddress,
    doctorAddress: input.doctorAddress,
    doctorName: input.doctorName,
    justification: input.justification,
    validUntil: input.validUntil,
    active: true,
  });
  const name = (await patientName(input.patientAddress)) ?? input.patientAddress;
  await appendAudit(
    actor,
    "Emergency Access",
    name,
    `${input.doctorName} triggered break-glass access for ${input.hours}h.`,
  );
  return strip(created);
}

export async function expireEmergency(
  input: ExpireEmergencyInput,
  actor?: AuditActor,
): Promise<{ ok: true }> {
  await connectToDatabase();
  const e = (await EmergencyModel.findOne({
    patientAddress: input.patientAddress,
  })
    .select("-__v")
    .lean()) as Doc | null;
  if (e) {
    await EmergencyModel.updateOne(
      { _id: e._id },
      { $set: { active: false } },
    );
    const name =
      (await patientName(input.patientAddress)) ?? input.patientAddress;
    await appendAudit(
      actor,
      "Emergency Access Expired",
      name,
      "Break-glass session ended.",
    );
  }
  return { ok: true as const };
}