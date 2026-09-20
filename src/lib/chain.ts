import {getAccount, 
  getChainId, 
  waitForTransactionReceipt, 
  writeContract} from "wagmi/actions";
  import { wagmiConfig } from "./wagmi";
  import { abi } from "./abi";
  import { contractAddress, contractChainId, isContractConfigured } from "./contract";


  export class ChainNotWiredError extends Error {
    constructor(operation: string, detail?: string) {
      super(`chain not wired: ${operation}${detail ? `-${detail}` : ""}`);
      this.name = "ChainNotWired";
    }
  }

  export interface ChainResult {
    transactionHash: string | null;
    ok: boolean;
  }

  function requireWrite(operation: string): void {
    if(!isContractConfigured()) {
      throw new ChainNotWiredError(operation, "NEXT_PUBLIC_CONTRACT_ADDRESS  is not configured");
    }
    const account = getAccount(wagmiConfig);
    if(!account.address) {
      throw new ChainNotWiredError(operation, "No wallet connected");
    }
    const chainId = getChainId(wagmiConfig);
    if(chainId !== contractChainId) {
      throw new ChainNotWiredError(operation, `Connected to ${chainId}, expected ${contractChainId}`);
    }
  }

  function requireSignerMatch(operation: string, given: string): void {
    const account = getAccount(wagmiConfig);
    if(account.address?.toLowerCase() !== given.toLowerCase()) {
      throw new ChainNotWiredError(operation, "This contract function uses msg.snder - connect the wallet that owns the address");
    }
  }


  async function confirm(operation: string, write: () => Promise<`0x${string}`>) {
    const hash = await write();
    const receipt = await waitForTransactionReceipt(wagmiConfig, {hash});
     if(receipt.status !== "success") {
      throw new Error(`chain ${operation}: transaction reverted`);
     }

     return {ok: true, transactionHash: hash}
  }


  export interface RegisterPatientInput {
    address: string;
    didURI: string;
  }

  export interface RegisterProviderInput {
    address: string;
    didURI: string;
  }

  export interface VerifyProviderInput {
    address: string;
    isVerified: boolean;
    eqQualifed: boolean;
  }

  export interface GrantConsentInput {
    patientAddress: string;
    providerAddress: string;
  }

  export interface RevokeConsentInput {
    patientAddress: string;
    providerAddress: string;
  }

  export interface AnchorRecordInput {
    patientAddress: string;
    recordId: string;
    recordHash: string;
    pointer: string;
  }

  export interface TombstoneRecordInput {
    patientAddress: string;
    recordId: string;
  }

  export interface EmergencyAccessInput {
    patientAddress: string;
    dcotorAddress: string;
    justification: string;
    validUntil: number;
  }


  export async function chainRegisterPatient(input: RegisterPatientInput):Promise<ChainResult> {
    const op = "registerPatient(address, didURI)";
    requireWrite(op);
    requireSignerMatch(op, input.address);

    return confirm(op, () =>
      writeContract(wagmiConfig, {
        address: contractAddress, 
        abi: abi,
        functionName: 'registerPatient',
        args: [input.didURI],
      })
    );
  }