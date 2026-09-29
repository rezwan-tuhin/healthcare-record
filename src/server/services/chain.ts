import { createPublicClient, http, keccak256, toHex, type Abi, type Hex } from "viem";
import { sepolia } from "viem/chains";
import { abi } from "@/lib/abi";
import type {
  Consent,
  EmergencyAccess,
  Patient,
  Provider,
  RecordAnchor,
} from "@/lib/dummy-data";

type Client = ReturnType<typeof createPublicClient>;

const address = String(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "").trim() as `0x${string}`;

const nowSeconds = () => Math.floor(Date.now() / 1000);

const toIso = (unixSeconds: bigint | number) =>
  new Date(Number(unixSeconds) * 1000).toISOString();

type MulticallContract = {
  address: `0x${string}`;
  abi: Abi;
  functionName: string;
  args: unknown[];
};

let client: Client | null = null;

function getContractClient(): Client {
  if (!client) {
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new Error("[chain] NEXT_PUBLIC_CONTRACT_ADDRESS is not configured or invalid.");
    }
    client = createPublicClient({
      chain: sepolia,
      transport: http(
        process.env.RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com",
      ),
    });
  }
  return client;
}

/**
 * Override registered/verified/didURI/name from `providers(addr)` — the only
 * writer is the deployed contract (REGULATOR_ROLE gates `verifyProvider`).
 */
export async function trustProviders<T extends Provider>(rows: T[]): Promise<T[]> {
  if (rows.length === 0) return rows;
  const c = getContractClient();
  const byIndex = new Map<number, number>();
  const contracts: MulticallContract[] = [];
  for (const [i, row] of rows.entries()) {
    if (!row.address) continue;
    byIndex.set(contracts.length, i);
    contracts.push({
      address,
      abi,
      functionName: "providers",
      args: [row.address],
    });
  }
  const results = await c.multicall({ contracts });
  for (const [callIndex, rowIndex] of byIndex) {
    const out = results[callIndex];
    if (out.status !== "success" || !Array.isArray(out.result)) continue;
    const [registered, verified, didURI, name] = out.result as [
      boolean,
      boolean,
      string,
      string,
    ];
    rows[rowIndex].registered = registered;
    rows[rowIndex].verified = verified;
    if (didURI) rows[rowIndex].didURI = didURI;
    if (name) rows[rowIndex].name = name;
  }
  return rows;
}

/** Override registered/didURI from `patients(addr)` (DID is chain-verifiable). */
export async function trustPatients<T extends Patient>(rows: T[]): Promise<T[]> {
  if (rows.length === 0) return rows;
  const c = getContractClient();
  const byIndex = new Map<number, number>();
  const contracts: MulticallContract[] = [];
  for (const [i, row] of rows.entries()) {
    if (!row.address) continue;
    byIndex.set(contracts.length, i);
    contracts.push({
      address,
      abi,
      functionName: "patients",
      args: [row.address],
    });
  }
  const results = await c.multicall({ contracts });
  for (const [callIndex, rowIndex] of byIndex) {
    const out = results[callIndex];
    if (out.status !== "success" || !Array.isArray(out.result)) continue;
    const [registered, didURI] = out.result as [boolean, string];
    rows[rowIndex].registered = registered;
    if (didURI) rows[rowIndex].didURI = didURI;
  }
  return rows;
}

/**
 * Override `active` from `hasValidAccess(patient, provider)`. The contract is
 * the only judge of "does this consent grant access right now" — it also covers
 * expiry plus any covering emergency session.
 */
export async function trustConsents<T extends Consent>(rows: T[]): Promise<T[]> {
  if (rows.length === 0) return rows;
  const c = getContractClient();
  const byIndex = new Map<number, number>();
  const contracts: MulticallContract[] = [];
  for (const [i, row] of rows.entries()) {
    byIndex.set(contracts.length, i);
    contracts.push({
      address,
      abi,
      functionName: "hasValidAccess",
      args: [row.patientAddress, row.providerAddress],
    });
  }
  const results = await c.multicall({ contracts });
  for (const [callIndex, rowIndex] of byIndex) {
    const out = results[callIndex];
    if (out.status !== "success" || !Array.isArray(out.result)) continue;
    rows[rowIndex].active = (out.result as [boolean])[0];
  }
  return rows;
}

/**
 * Override active/validUntil/doctorAddress from `emergencySessions(patient)`.
 * A session with `validUntil == 0` does not exist on-chain → inactive.
 */
export async function trustEmergency<T extends EmergencyAccess>(
  rows: T[],
): Promise<T[]> {
  if (rows.length === 0) return rows;
  const c = getContractClient();
  const byIndex = new Map<number, number>();
  const contracts: MulticallContract[] = [];
  for (const [i, row] of rows.entries()) {
    byIndex.set(contracts.length, i);
    contracts.push({
      address,
      abi,
      functionName: "emergencySessions",
      args: [row.patientAddress],
    });
  }
  const results = await c.multicall({ contracts });
  const now = nowSeconds();
  for (const [callIndex, rowIndex] of byIndex) {
    const out = results[callIndex];
    if (out.status !== "success" || !Array.isArray(out.result)) continue;
    const [validUntil, doctor] = out.result as [bigint, `0x${string}`];
    rows[rowIndex].active = validUntil > BigInt(0) && validUntil > BigInt(now);
    rows[rowIndex].validUntil = toIso(validUntil);
    if (doctor && /^0x[a-fA-F0-9]{40}$/.test(doctor)) {
      rows[rowIndex].doctorAddress = doctor;
    }
  }
  return rows;
}

/**
 * Records are the core truth claim: `recordAnchors(patient, keccak(recordId))`.
 * A row whose anchor does not exist on-chain (anchoredAt == 0) — or whose
 * stored hash differs from the anchored hash — is NOT returned: the UI only
 * ever lists documents the contract confirms. Existing rows are overridden with
 * the on-chain anchoredBy/anchoredAt/tombstoned.
 */
export async function trustRecords<T extends RecordAnchor>(rows: T[]): Promise<T[]> {
  if (rows.length === 0) return rows;
  const c = getContractClient();
  const byIndex = new Map<number, number>();
  const contracts: MulticallContract[] = [];
  for (const [i, row] of rows.entries()) {
    byIndex.set(contracts.length, i);
    contracts.push({
      address,
      abi,
      functionName: "recordAnchors",
      args: [row.patientAddress, keccak256(toHex(row.recordId)) as Hex],
    });
  }
  const results = await c.multicall({ contracts });
  const keep = new Array<boolean>(rows.length).fill(true);
  for (const [callIndex, rowIndex] of byIndex) {
    const out = results[callIndex];
    if (out.status !== "success" || !Array.isArray(out.result)) {
      keep[rowIndex] = false;
      continue;
    }
    const [recordHash, , anchoredBy, anchoredAt, tombstoned] = out.result as [
      Hex,
      string,
      `0x${string}`,
      bigint,
      boolean,
    ];
    if (anchoredAt === BigInt(0)) {
      keep[rowIndex] = false; // never anchored on-chain → not trusted
      continue;
    }
    if (recordHash.toLowerCase() !== rows[rowIndex].recordHash.toLowerCase()) {
      keep[rowIndex] = false; // claim contradicts the chain → not trusted
      continue;
    }
    rows[rowIndex].anchoredBy = anchoredBy;
    rows[rowIndex].anchoredAt = toIso(anchoredAt);
    rows[rowIndex].tombstoned = tombstoned;
  }
  return rows.filter((_, i) => keep[i]);
}