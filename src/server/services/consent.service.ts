import { connectToDatabase } from "../connection";
import { patientName, strip, type Doc } from "./shared";
import { appendAudit } from "./audit.service";
import { trustConsents } from "./chain";
import { ConsentModel, PROJECTED_FIELDS } from "@/server/models";
import type { Consent } from "@/lib/dummy-data";
import type {
  AuditActor,
  GrantConsentInput,
  RevokeConsentInput,
} from "@/server/db-types";

export async function listConsents(): Promise<Array<Consent & { patientName?: string }>> {
  await connectToDatabase();
  const consents = await trustConsents(
    (await ConsentModel.find()
      .select(PROJECTED_FIELDS)
      .lean()) as unknown as Consent[],
  );
  return Promise.all(
    consents.map(async (c) => ({
      ...c,
      patientName: (await patientName(c.patientAddress)) ?? c.patientAddress,
    })),
  );
}

export async function grantConsent(
  input: GrantConsentInput,
  actor?: AuditActor,
): Promise<Consent> {
  await connectToDatabase();
  await ConsentModel.deleteMany({
    patientAddress: input.patientAddress,
    providerAddress: input.providerAddress,
  });
  const created = await ConsentModel.create({
    patientAddress: input.patientAddress,
    providerAddress: input.providerAddress,
    providerName: input.providerName,
    active: true,
    expiresAt: input.expiresAt,
    purpose: input.purpose,
    grantedAt: new Date().toISOString(),
  });
  await appendAudit(
    actor,
    "Consent Granted",
    input.providerName,
    `Patient ${input.patientAddress} granted access. Expires ${new Date(
      input.expiresAt * 1000,
    ).toISOString()}.`,
  );
  return strip(created);
}

export async function revokeConsent(
  input: RevokeConsentInput,
  actor?: AuditActor,
): Promise<{ ok: true }> {
  await connectToDatabase();
  const c = (await ConsentModel.findOne({
    patientAddress: input.patientAddress,
    providerAddress: input.providerAddress,
  })
    .select("-__v")
    .lean()) as Doc | null;
  if (c) {
    await ConsentModel.updateOne(
      { _id: c._id },
      { $set: { active: false } },
    );
    await appendAudit(
      actor,
      "Consent Revoked",
      String(c.providerName),
      `Patient ${input.patientAddress} revoked access.`,
    );
  }
  return { ok: true as const };
}