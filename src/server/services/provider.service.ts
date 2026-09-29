import { connectToDatabase } from "../connection";
import { makeInitials } from "./shared";
import { appendAudit } from "./audit.service";
import { trustProviders } from "./chain";
import { ProviderModel, ProviderProfileModel, UserModel, PROJECTED_FIELDS } from "@/server/models";
import type { Provider, ProviderProfile } from "@/lib/dummy-data";
import type {
  AuditActor,
  RegisterProviderInput,
  UpsertProviderProfileInput,
  VerifyProviderInput,
} from "@/server/db-types";

export async function listProviders(): Promise<Array<Provider & Partial<ProviderProfile>>> {
  await connectToDatabase();
  const [providers, profiles] = await Promise.all([
    ProviderModel.find().select(PROJECTED_FIELDS).lean(),
    ProviderProfileModel.find().select(PROJECTED_FIELDS).lean(),
  ]);
  return trustProviders(
    (providers as unknown as Provider[]).map((p) => {
      const prof = (profiles as unknown as ProviderProfile[]).find((x) => x.address === p.address);
      if (!prof) return { ...p };
      return {
        ...p,
        name: prof.name || p.name,
        specialty: prof.specialty,
        licenseNumber: prof.licenseNumber,
        hospital: prof.hospital,
        email: prof.email,
        role: prof.role,
      };
    }),
  );
}

export async function registerProvider(
  input: RegisterProviderInput,
  actor?: AuditActor,
): Promise<Provider> {
  await connectToDatabase();
  const p = (await ProviderModel.findOneAndUpdate(
    { address: input.address },
    {
      $set: { name: input.name, didURI: input.didURI, registered: true },
      $setOnInsert: { verified: false, erQualified: false },
    },
    { new: true, upsert: true },
  )
    .select(PROJECTED_FIELDS)
    .lean()) as unknown as Provider;
  await appendAudit(
    actor,
    "Provider Registered",
    p.name,
    "Provider identity registered with DID.",
  );
  return p;
}

export async function verifyProvider(
  input: VerifyProviderInput,
  actor?: AuditActor,
): Promise<Provider> {
  await connectToDatabase();
  const p = (await ProviderModel.findOne({ address: input.address })
    .select(PROJECTED_FIELDS)
    .lean()) as unknown as Provider | null;
  if (!p) throw new Error("Provider not found");
  const isVerified = input.isVerified;
  const erQualified = isVerified ? input.erQualified : false;
  const updated = (await ProviderModel.findOneAndUpdate(
    { address: input.address },
    { $set: { verified: isVerified, erQualified } },
    { new: true },
  )
    .select(PROJECTED_FIELDS)
    .lean()) as unknown as Provider;
  await appendAudit(
    actor,
    isVerified ? "Provider Verified" : "Provider Unverified",
    updated.name,
    `ER qualified: ${erQualified ? "yes" : "no"}`,
  );
  return updated;
}

export async function getProviderProfile(
  address: string,
): Promise<ProviderProfile | null> {
  await connectToDatabase();
  return (await ProviderProfileModel.findOne({ address })
    .select(PROJECTED_FIELDS)
    .lean()) as unknown as ProviderProfile | null;
}

export async function upsertProviderProfile(
  input: UpsertProviderProfileInput,
): Promise<ProviderProfile> {
  await connectToDatabase();
  const existing = (await ProviderProfileModel.findOne({ address: input.address })
    .select(PROJECTED_FIELDS)
    .lean()) as { role?: string } | null;
  const role = existing?.role ?? "provider";
  await ProviderProfileModel.updateOne(
    { address: input.address },
    {
      $set: {
        name: input.name,
        specialty: input.specialty,
        licenseNumber: input.licenseNumber,
        hospital: input.hospital,
        email: input.email,
        role,
        address: input.address,
      },
    },
    { upsert: true },
  );
  const prof = (await ProviderProfileModel.findOne({ address: input.address })
    .select(PROJECTED_FIELDS)
    .lean()) as unknown as ProviderProfile;
  await ProviderModel.updateOne(
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
  return prof;
}