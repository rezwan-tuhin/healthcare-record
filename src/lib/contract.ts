import { keccak256, toHex } from "viem";
import { wagmiConfig } from "./wagmi";

export const contractChainId = wagmiConfig.chains[0].id;
const rawAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS?.trim() ?? "";
export const contractAddress = rawAddress as `0x${string}`;


export function isContractConfigured(): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(contractAddress);
}

export const ROLE_IDS = {
    REGULATOR: keccak256(toHex("REGULATOR_ROLE")),
    VERIFIED_PROVIDER: keccak256(toHex("VERIFIED_PROVIDER")),
    ER_SPECIALIST: keccak256(toHex("ER_SPECIALIST_ROLE"))
} as const;

