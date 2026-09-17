import { useReadContract } from "wagmi";
import { useAccount, useChainId } from "wagmi";
import type { Address } from "viem";
import { abi } from "@/lib/abi";
import { contractAddress, contractChainId } from "@/lib/contract";


export function useChainStatus() {
    const {address, isConnected} = useAccount();

    const chainId = useChainId();

    return {
        isWalletConnected: isConnected,
        address,
        expectedChainId: contractChainId,
    }
}


export function usePatientOnChain(address?: string) {
    return useReadContract({
        address: contractAddress,
        abi: abi,
        functionName: "patients",
        args: address ? [address as Address] : undefined,
        query: {enabled: !!address}
     })
}

export function useProviderOnChain(address? : string) {
    return useReadContract({
        address: contractAddress, 
        abi: abi,
        functionName: 'providers',
        args: address ? [address as Address] : undefined,
        query: {enabled: !!address}
    })
}

export function useHasValidAccess (patient?: string, accessor?: string) {
    return useReadContract({
        address: contractAddress,
        abi: abi,
        functionName: 'hasValidAccess',
        args: patient && accessor ? [patient as Address, accessor as Address] : undefined,
        query: {enabled: !!patient && !!accessor}
    })
}

