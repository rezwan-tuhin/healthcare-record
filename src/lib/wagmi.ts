import {http, webSocket} from 'wagmi';
import {sepolia} from 'wagmi/chains';
import {getDefaultConfig} from "@rainbow-me/rainbowkit";

const projectid = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";

const appName = "HealthRecord";

const resolveProjectId = projectid || "YOUR_PROJECT_ID";


const transports = {
    [sepolia.id] : http(process.env.NEXT_PUBLIC_RPC_URL ?? 'https://ethereum-sepolia-rpc.publicnode.com'),
}

export const wagmiConfig = getDefaultConfig({
    appName, 
    projectId: resolveProjectId,
    chains: [sepolia],
    ssr: true,
    transports
});
