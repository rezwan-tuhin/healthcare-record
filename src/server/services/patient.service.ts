import { connectToDatabase } from "../connection";
import { makeInitials } from "./shared";
import { appendAudit } from "./audit.service";
import { trustPatients } from "./chain";
import { PatientModel, PatientProfileModel, UserModel, PROJECTED_FIELDS } from "@/server/models";
import type { Patient, PatientProfile } from "@/lib/dummy-data";
import type { AuditActor, RegisterPatientInput } from "@/server/db-types";

export async function listPatients(): Promise<Array<Patient & Partial<PatientProfile>>> {
  await connectToDatabase();
  const [patients, profiles] = await Promise.all([
    PatientModel.find().select(PROJECTED_FIELDS).lean(),
    PatientProfileModel.find().select(PROJECTED_FIELDS).lean(),
  ]);
  return trustPatients(
    (patients as unknown as Patient[]).map((p) => {
      const prof = (profiles as unknown as PatientProfile[]).find((x) => x.address === p.address);
      return prof ? { ...p, ...prof } : { ...p };
    }),
  );
}

export async function registerPatient(
  input: RegisterPatientInput,
  actor?: AuditActor,
): Promise<Patient> {
  await connectToDatabase();
  const p = (await PatientModel.findOneAndUpdate(
    { address: input.address },
    { $set: { registered: true, didURI: input.didURI } },
    { new: true, upsert: true },
  )
    .select(PROJECTED_FIELDS)
    .lean()) as unknown as Patient;
  await appendAudit(
    actor,
    "Patient Registered",
    p.address,
    "Patient identity registered with DID.",
  );
  return p;
}

export async function getPatientProfile(
  address: string,
): Promise<PatientProfile | null> {
  await connectToDatabase();
  return (await PatientProfileModel.findOne({ address })
    .select(PROJECTED_FIELDS)
    .lean()) as unknown as PatientProfile | null;
}

export async function upsertPatientProfile(
  input: PatientProfile,
): Promise<PatientProfile> {
  await connectToDatabase();
  const prof = await PatientProfileModel.findOneAndUpdate(
    { address: input.address },
    {
      $set: {
        name: input.name,
        dob: input.dob,
        bloodType: input.bloodType,
        allergies: [...input.allergies],
        emergencyContact: input.emergencyContact,
        primaryProvider: input.primaryProvider,
        insurance: input.insurance,
        address: input.address,
      },
    },
    { new: true, upsert: true },
  )
    .select(PROJECTED_FIELDS)
    .lean();
  await PatientModel.updateOne(
    { address: input.address },
    { $set: { name: input.name } },
  );
  const u = (await UserModel.findOne({ address: input.address }).lean()) as
    | Record<string, unknown>
    | null;
  if (u) {
    await UserModel.updateOne(
      { address: input.address },
      { $set: { name: input.name, initials: makeInitials(input.name) } },
    );
  }
  return prof as unknown as PatientProfile;
}


