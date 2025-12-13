'use client';

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Chatbot } from "@/components/chatbot";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const CONTRACT_ADDRESS = "0x2FA1029C50dfeC28434334d3C52780002f771295";
const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_user",
        "type": "address"
      }
    ],
    "name": "getPenisLength",
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
    "name": "getPenisName",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
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
    "name": "penisLengths",
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
        "name": "",
        "type": "address"
      }
    ],
    "name": "penisNames",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_length",
        "type": "uint256"
      }
    ],
    "name": "setPenisLength",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_name",
        "type": "string"
      }
    ],
    "name": "setPenisName",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Modified ABI to change colors
const CONTRACT_ABI_MODIFIED = CONTRACT_ABI.map((func) => {
  if (func.name === "setPenisLength" || func.name === "setPenisName") {
    return {
      ...func,
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_length",
          "type": "uint256"
        }
      ],
      "name": func.name,
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function",
      "constant": false,
      "payable": false,
      "gas": "0x5208",
      "gasPrice": "0x186a0",
      "value": "0x0",
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_length",
          "type": "uint256"
        }
      ],
      "name": func.name,
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    };
  }
  return func;
});

export default function ContractPage() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [currentCode, setCurrentCode] = useState<string>("");

  // Fetch current code on mount
  useEffect(() => {
    // Read the current component code (we'll store it as a string)
    // Since we can't read files client-side, we'll fetch it from backend if needed
    // For now, we'll pass an empty string and let the backend read it
    setCurrentCode("");
  }, []);
  
  // Input states
  const [getPenisLength__user, set_getPenisLength__user] = useState("");
  const [getPenisName__user, set_getPenisName__user] = useState("");
  const [penisLengths_param0, set_penisLengths_param0] = useState("");
  const [penisNames_param0, set_penisNames_param0] = useState("");
  const [setPenisLength__length, set_setPenisLength__length] = useState("");
  const [setPenisName__name, set_setPenisName__name] = useState("");
  
  // Result states
  const [getPenisLengthResult, set_getPenisLengthResult] = useState<string | null>(null);
  const [getPenisNameResult, set_getPenisNameResult] = useState<string | null>(null);
  const [penisLengthsResult, set_penisLengthsResult] = useState<string | null>(null);
  const [penisNamesResult, set_penisNamesResult] = useState<string | null>(null);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setError("Please install MetaMask");
        return;
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI_MODIFIED, signer);
      setContract(contractInstance);
      setConnected(true);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const call_getPenisLength = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const result = await contract.getPenisLength(getPenisLength__user);
      set_getPenisLengthResult(result.toString());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  const call_getPenisName = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const result = await contract.getPenisName(getPenisName__user);
      set_getPenisNameResult(result.toString());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  const call_penisLengths = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const result = await contract.penisLengths(penisLengths_param0);
      set_penisLengthsResult(result.toString());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  const call_penisNames = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const result = await contract.penisNames(penisNames_param0);
      set_penisNamesResult(result.toString());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const call_setPenisLength = async () => {
    if (!contract) return;
    setLoading(true);
    setError(null);
    try {
      const tx = await contract.setPenisLength(setPenisLength__length);
      await tx.wait();
      setTxHash(tx.hash);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  const call_setPenisName = async () => {
    if (!contract) return;
    setLoading(true);
    setError(null);
    try {
      const tx = await contract.setPenisName(setPenisName__name);
      await tx.wait();
      setTxHash(tx.hash);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black min-h-screen flex items-start p-4 gap-4">
      {/* Contract Interface */}
      <Card className="w-full max-w-md bg-red-400 border-red-300 mx-auto">
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
              <Input
                placeholder="_user (address)"
                value={getPenisLength__user}
                onChange={(e) => set_getPenisLength__user(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
                <Button onClick={call_getPenisLength} disabled={loading} variant="secondary" size="sm">
                  getPenisLength
                </Button>
              </div>
              {getPenisLengthResult && (
                <p className="text-2xl font-bold text-pink-400">{getPenisLengthResult}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex gap-2 items-center">
              <Input
                placeholder="_user (address)"
                value={getPenisName__user}
                onChange={(e) => set_getPenisName__user(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
                <Button onClick={call_getPenisName} disabled={loading} variant="secondary" size="sm">
                  getPenisName
                </Button>
              </div>
              {getPenisNameResult && (
                <p className="text-2xl font-bold text-pink-400">{getPenisNameResult}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex gap-2 items-center">
              <Input
                placeholder="param0 (address)"
                value={penisLengths_param0}
                onChange={(e) => set_penisLengths_param0(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
                <Button onClick={call_penisLengths} disabled={loading} variant="secondary" size="sm">
                  penisLengths
                </Button>
              </div>
              {penisLengthsResult && (
                <p className="text-2xl font-bold text-pink-400">{penisLengthsResult}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex gap-2 items-center">
              <Input
                placeholder="param0 (address)"
                value={penisNames_param0}
                onChange={(e) => set_penisNames_param0(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
                <Button onClick={call_penisNames} disabled={loading} variant="secondary" size="sm">
                  penisNames
                </Button>
              </div>
              {penisNamesResult && (
                <p className="text-2xl font-bold text-pink-400">{penisNamesResult}</p>
              )}
            </div>
              
              {/* Write Functions */}

            <div className="space-y-2">
              <Input
                placeholder="_length (uint256)"
                value={setPenisLength__length}
                onChange={(e) => set_setPenisLength__length(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
              <Button onClick={call_setPenisLength} disabled={loading} className="w-full">
                {loading ? "..." : "setPenisLength"}
              </Button>
            </div>

            <div className="space-y-2">
              <Input
                placeholder="_name (string)"
                value={setPenisName__name}
                onChange={(e) => set_setPenisName__name(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
              <Button onClick={call_setPenisName} disabled={loading} className="w-full">
                {loading ? "..." : "setPenisName"}
              </Button>
            </div>
            </div>
          )}
          
          {txHash && (
            <p className="text-xs text-pink-400 break-all">
              TX: {txHash}
            </p>
          )}
          
          {error && (
            <p className="text-pink-400 text-sm">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Chatbot Panel - Fixed on the right */}
      <div className="fixed right-4 top-4 w-[400px] flex-shrink-0">
        <Chatbot
          contractAddress={CONTRACT_ADDRESS}
          contractABI={CONTRACT_ABI_MODIFIED}
          currentCode={currentCode}
        />
      </div>
    </div>
  );
}