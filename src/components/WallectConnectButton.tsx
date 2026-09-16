'use client'
import {useState, useEffect} from 'react';
import {ConnectButton} from "@rainbow-me/rainbowkit";

export function WalletConnectButton() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    },[]);


    if(!mounted) {
        return (
            <button className='cursor-default rounded-2xl border border-zinc-700 bg-zinc-900/60 px-6 py-3.5 text-sm font-medium text-zinc-400'>Connect Wallet</button>
        );
    }

    return <ConnectButton chainStatus="icon" showBalance = {false} />;
}