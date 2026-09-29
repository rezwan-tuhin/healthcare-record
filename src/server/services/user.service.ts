import { connectToDatabase } from "../connection";
import { makeInitials, nextNumericId, strip } from "./shared";
import { appendAudit } from "./audit.service";
import { UserModel, PROJECTED_FIELDS } from "@/server/models";
import type { User } from "@/lib/dummy-data";
import type { SignupInput } from "@/server/db-types";

export async function resolveUser(address: string): Promise<User | null> {
  await connectToDatabase();
  return (await UserModel.findOne({ address })
    .select(PROJECTED_FIELDS)
    .lean()) as unknown as User | null;
}

export async function listUsers(): Promise<User[]> {
  await connectToDatabase();
  return (await UserModel.find()
    .select(PROJECTED_FIELDS)
    .sort({ id: 1 })
    .lean()) as unknown as User[];
}

export async function signup(input: SignupInput): Promise<User> {
  await connectToDatabase();
  const existing = (await UserModel.findOne({ address: input.address })
    .select(PROJECTED_FIELDS)
    .lean()) as unknown as User | null;
  if (existing) {
    await UserModel.updateOne(
      { address: input.address },
      {
        $set: {
          name: input.name,
          didURI: input.didURI,
          role: input.role,
          initials: makeInitials(input.name),
        },
      },
    );
    return (await UserModel.findOne({ address: input.address })
      .select(PROJECTED_FIELDS)
      .lean()) as unknown as User;
  }
  const user = await UserModel.create({
    id: await nextNumericId(UserModel),
    name: input.name,
    address: input.address,
    didURI: input.didURI,
    role: input.role,
    initials: makeInitials(input.name),
  });
  await appendAudit(
    undefined,
    "Account Created",
    user.name,
    `${user.role} account created with DID ${user.didURI}`,
  );
  return strip(user);
}