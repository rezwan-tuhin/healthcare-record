import { connectToDatabase } from "../connection";
import { makeIpfsCid, makeRecordId, patientName, strip, type Doc } from "./shared";
import { appendAudit } from "./audit.service";
import { trustRecords } from "./chain";
import { RecordAnchorModel, PROJECTED_FIELDS } from "@/server/models";
import type { RecordAnchor } from "@/lib/dummy-data";
import type {
  AnchorRecordInput,
  AuditActor,
  TombstoneRecordInput,
} from "@/server/db-types";

export async function listRecords(): Promise<Array<RecordAnchor & { patientName?: string }>> {
  await connectToDatabase();
  const records = await trustRecords(
    (await RecordAnchorModel.find()
      .select(PROJECTED_FIELDS)
      .lean()) as unknown as RecordAnchor[],
  );
  return Promise.all(
    records.map(async (r) => ({
      ...r,
      patientName: (await patientName(r.patientAddress)) ?? r.patientAddress,
    })),
  );
}

export async function anchorRecord(
  input: AnchorRecordInput,
  actor?: AuditActor,
): Promise<RecordAnchor> {
  await connectToDatabase();
  const ipfsCid = input.ipfsCid ?? makeIpfsCid();
  const rec: RecordAnchor = {
    patientAddress: input.patientAddress,
    recordId: makeRecordId(),
    recordHash: input.recordHash,
    pointer: input.pointer ?? `ipfs://${ipfsCid}`,
    ipfsCid,
    anchoredBy: input.anchoredBy ?? actor?.name ?? "system",
    anchoredAt: new Date().toISOString(),
    tombstoned: false,
    title: input.title,
    recordType: input.recordType ?? "lab_report",
    date: new Date().toISOString().slice(0, 10),
    providerName: input.providerName ?? actor?.name ?? "Unknown physician",
    hospital: input.hospital ?? "—",
    content: input.content ?? {},
    hashVerified: true,
    ipfsSimulated: input.ipfsSimulated ?? false,
  };
  if (input.fileName) rec.fileName = input.fileName;
  const created = await RecordAnchorModel.create(rec);
  const name = (await patientName(input.patientAddress)) ?? input.patientAddress;
  await appendAudit(
    actor,
    "Record Anchored",
    name,
    `${input.title.slice(0, 48)} hash anchored to ledger. CID ${ipfsCid}.`,
  );
  return strip(created);
}

export async function tombstoneRecord(
  input: TombstoneRecordInput,
  actor?: AuditActor,
): Promise<{ ok: true }> {
  await connectToDatabase();
  const r = (await RecordAnchorModel.findOne({
    patientAddress: input.patientAddress,
    recordId: input.recordId,
  })
    .select("-__v")
    .lean()) as Doc | null;
  if (!r) throw new Error("Record not found");
  await RecordAnchorModel.updateOne(
    { _id: r._id },
    { $set: { tombstoned: true } },
  );
  await appendAudit(
    actor,
    "Record Tombstoned",
    String(r.title),
    "Record marked invalid and removed from active feed.",
  );
  return { ok: true as const };
}