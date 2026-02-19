'use client';

import React, { useState } from "react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const CONTRACT_ADDRESS = "0x9c2976D18c4Ce23F7B2786E8e58Ed2Cc63b472d8";
const CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "count",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decrement",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "increment",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export default function ContractPage() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  
  // Input states
  
  
  // Result states
  const [countResult, set_countResult] = useState<string | null>(null);
  const [getCountResult, set_getCountResult] = useState<string | null>(null);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setError("Please install MetaMask");
        return;
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      setContract(contractInstance);
      setConnected(true);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const call_count = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const result = await contract.count();
      set_countResult(result.toString());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  const call_getCount = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const result = await contract.getCount();
      set_getCountResult(result.toString());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const call_decrement = async () => {
    if (!contract) return;
    setLoading(true);
    setError(null);
    try {
      const tx = await contract.decrement();
      await tx.wait();
      setTxHash(tx.hash);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  const call_increment = async () => {
    if (!contract) return;
    setLoading(true);
    setError(null);
    try {
      const tx = await contract.increment();
      await tx.wait();
      setTxHash(tx.hash);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-center">Contract Interface</CardTitle>
          <p className="text-xs text-slate-500 font-mono text-center break-all">{CONTRACT_ADDRESS}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!connected ? (
            <Button onClick={connectWallet} className="w-full">
              Connect Wallet
            </Button>
          ) : (
            <div className="space-y-4">
              {/* Read Functions */}

            <div className="space-y-2">
              <div className="flex gap-2 items-center">
                <Button onClick={call_count} disabled={loading} variant="secondary" size="sm">
                  count
                </Button>
              </div>
              {countResult && (
                <p className="text-2xl font-bold text-emerald-400">{countResult}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex gap-2 items-center">
                <Button onClick={call_getCount} disabled={loading} variant="secondary" size="sm">
                  getCount
                </Button>
              </div>
              {getCountResult && (
                <p className="text-2xl font-bold text-emerald-400">{getCountResult}</p>
              )}
            </div>
              
              {/* Write Functions */}

            <div className="space-y-2">
              <Button onClick={call_decrement} disabled={loading} className="w-full">
                {loading ? "..." : "decrement"}
              </Button>
            </div>

            <div className="space-y-2">
              <Button onClick={call_increment} disabled={loading} className="w-full">
                {loading ? "..." : "increment"}
              </Button>
            </div>
            </div>
          )}
          
          {txHash && (
            <p className="text-xs text-emerald-400 break-all">
              TX: {txHash}
            </p>
          )}
          
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
