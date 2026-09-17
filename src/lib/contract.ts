import { wagmiConfig } from "./wagmi";

export const contractChainId = wagmiConfig.chains[0].id;
const rawAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS?.trim() ?? "";
export const contractAddress = rawAddress as `0x${string}`;

