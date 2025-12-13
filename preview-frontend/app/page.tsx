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

const CONTRACT_ADDRESS = "0xFF72e4b869926D4cC9b48946Fa4082E75512FB43";
const CONTRACT_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newCounterValue",
        "type": "uint256"
      }
    ],
    "name": "CounterIncremented",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "interactions",
        "type": "uint256"
      }
    ],
    "name": "UserInteractionUpdated",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "counter",
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
    "name": "getCounter",
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
    "inputs": [
      {
        "internalType": "address",
        "name": "_user",
        "type": "address"
      }
    ],
    "name": "getUserInteractions",
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
    "name": "incrementCounter",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "userInteractions",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
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
  const [getUserInteractions__user, set_getUserInteractions__user] = useState("");
  const [userInteractions_param0, set_userInteractions_param0] = useState("");
  
  // Result states
  const [counterResult, set_counterResult] = useState<string | null>(null);
  const [getCounterResult, set_getCounterResult] = useState<string | null>(null);
  const [getUserInteractionsResult, set_getUserInteractionsResult] = useState<string | null>(null);
  const [userInteractionsResult, set_userInteractionsResult] = useState<string | null>(null);

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

  const call_counter = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const result = await contract.counter();
      set_counterResult(result.toString());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  const call_getCounter = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const result = await contract.getCounter();
      set_getCounterResult(result.toString());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  const call_getUserInteractions = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const result = await contract.getUserInteractions(getUserInteractions__user);
      set_getUserInteractionsResult(result.toString());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  const call_userInteractions = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const result = await contract.userInteractions(userInteractions_param0);
      set_userInteractionsResult(result.toString());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const call_incrementCounter = async () => {
    if (!contract) return;
    setLoading(true);
    setError(null);
    try {
      const tx = await contract.incrementCounter();
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
                <Button onClick={call_counter} disabled={loading} variant="secondary" size="sm">
                  counter
                </Button>
              </div>
              {counterResult && (
                <p className="text-2xl font-bold text-emerald-400">{counterResult}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex gap-2 items-center">
                <Button onClick={call_getCounter} disabled={loading} variant="secondary" size="sm">
                  getCounter
                </Button>
              </div>
              {getCounterResult && (
                <p className="text-2xl font-bold text-emerald-400">{getCounterResult}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex gap-2 items-center">
              <Input
                placeholder="_user (address)"
                value={getUserInteractions__user}
                onChange={(e) => set_getUserInteractions__user(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
                <Button onClick={call_getUserInteractions} disabled={loading} variant="secondary" size="sm">
                  getUserInteractions
                </Button>
              </div>
              {getUserInteractionsResult && (
                <p className="text-2xl font-bold text-emerald-400">{getUserInteractionsResult}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex gap-2 items-center">
              <Input
                placeholder="param0 (address)"
                value={userInteractions_param0}
                onChange={(e) => set_userInteractions_param0(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
                <Button onClick={call_userInteractions} disabled={loading} variant="secondary" size="sm">
                  userInteractions
                </Button>
              </div>
              {userInteractionsResult && (
                <p className="text-2xl font-bold text-emerald-400">{userInteractionsResult}</p>
              )}
            </div>
              
              {/* Write Functions */}

            <div className="space-y-2">
              <Button onClick={call_incrementCounter} disabled={loading} className="w-full">
                {loading ? "..." : "incrementCounter"}
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
