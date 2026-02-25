'use client';

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Check, ExternalLink, Code, Play } from "lucide-react";

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface PreviewData {
  contractAddress: string;
  abi: any[];
  frontendCode: string;
  explorerLink: string;
  timestamp: number;
}

interface FunctionInput {
  name: string;
  type: string;
}

interface ContractFunction {
  name: string;
  type: string;
  stateMutability: string;
  inputs: FunctionInput[];
  outputs: FunctionInput[];
}

export default function PreviewPage() {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [functionInputs, setFunctionInputs] = useState<Record<string, Record<string, string>>>({});
  const [functionResults, setFunctionResults] = useState<Record<string, string>>({});
  const [executingFunction, setExecutingFunction] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load preview data from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('dapp-preview-data');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setPreviewData(data);
      } catch (e) {
        console.error('Failed to parse preview data:', e);
      }
    }
    setLoading(false);
  }, []);

  const getMetaMaskProvider = () => {
    const ethereum = window.ethereum;
    if (!ethereum) return null;
    
    if (ethereum.providers?.length) {
      const mm = ethereum.providers.find(
        (p: any) => p._metamask || (p.isMetaMask && !p.isUniswapWallet && !p.isCoinbaseWallet && !p.isBraveWallet)
      );
      if (mm) return mm;
    }
    
    if (ethereum.providerMap) {
      const mm = ethereum.providerMap.get('MetaMask');
      if (mm) return mm;
    }
    
    if (ethereum._metamask || (ethereum.isMetaMask && !ethereum.isUniswapWallet)) {
      return ethereum;
    }
    
    return null;
  };

  const connectWallet = async () => {
    if (!previewData) return;
    
    try {
      const metamaskProvider = getMetaMaskProvider();
      
      if (!metamaskProvider) {
        setError("MetaMask not found. Please install MetaMask or set it as your default wallet.");
        return;
      }
      
      const provider = new ethers.BrowserProvider(metamaskProvider);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const contractInstance = new ethers.Contract(previewData.contractAddress, previewData.abi, signer);
      setContract(contractInstance);
      setConnected(true);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleInputChange = (fnName: string, inputName: string, value: string) => {
    setFunctionInputs(prev => ({
      ...prev,
      [fnName]: {
        ...(prev[fnName] || {}),
        [inputName]: value,
      }
    }));
  };

  const callFunction = async (fn: ContractFunction) => {
    if (!contract) return;
    
    setExecutingFunction(fn.name);
    setError(null);
    
    try {
      const args = fn.inputs.map((input, idx) => {
        const inputName = input.name || `param${idx}`;
        return functionInputs[fn.name]?.[inputName] || '';
      });
      
      const isReadOnly = fn.stateMutability === 'view' || fn.stateMutability === 'pure';
      
      if (isReadOnly) {
        const result = await contract[fn.name](...args);
        setFunctionResults(prev => ({
          ...prev,
          [fn.name]: result.toString(),
        }));
      } else {
        const tx = await contract[fn.name](...args);
        await tx.wait();
        setTxHash(tx.hash);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setExecutingFunction(null);
    }
  };

  const copyCode = async () => {
    if (!previewData?.frontendCode) return;
    await navigator.clipboard.writeText(previewData.frontendCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get functions from ABI
  const functions = previewData?.abi?.filter(
    (item: any) => item.type === 'function' && !item.name?.startsWith('_')
  ) as ContractFunction[] || [];
  
  const readFunctions = functions.filter(
    fn => fn.stateMutability === 'view' || fn.stateMutability === 'pure'
  );
  
  const writeFunctions = functions.filter(
    fn => fn.stateMutability !== 'view' && fn.stateMutability !== 'pure'
  );

  if (loading) {
    return (
      <div className="bg-slate-900 min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!previewData) {
    return (
      <div className="bg-slate-900 min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-center">No Contract Data</CardTitle>
            <CardDescription className="text-slate-400 text-center">
              Please deploy a contract from the main page first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Go to Deploy Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 min-h-screen p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Contract Preview</h1>
          <a 
            href={previewData.explorerLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-slate-400 font-mono hover:text-emerald-400 flex items-center justify-center gap-1"
          >
            {previewData.contractAddress}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <Tabs defaultValue="interact" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800">
            <TabsTrigger value="interact" className="data-[state=active]:bg-slate-700">
              <Play className="w-4 h-4 mr-2" />
              Interact
            </TabsTrigger>
            <TabsTrigger value="code" className="data-[state=active]:bg-slate-700">
              <Code className="w-4 h-4 mr-2" />
              View Code
            </TabsTrigger>
          </TabsList>

          {/* Interact Tab */}
          <TabsContent value="interact">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6 space-y-4">
                {!connected ? (
                  <Button onClick={connectWallet} className="w-full">
                    Connect Wallet
                  </Button>
                ) : (
                  <div className="space-y-6">
                    {/* Read Functions */}
                    {readFunctions.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                          Read Functions
                        </h3>
                        {readFunctions.map((fn) => (
                          <div key={fn.name} className="space-y-2 p-3 bg-slate-700/50 rounded-lg">
                            <div className="flex flex-wrap gap-2 items-center">
                              {fn.inputs.map((input, idx) => (
                                <Input
                                  key={`${fn.name}-${input.name || idx}`}
                                  placeholder={`${input.name || `param${idx}`} (${input.type})`}
                                  value={functionInputs[fn.name]?.[input.name || `param${idx}`] || ''}
                                  onChange={(e) => handleInputChange(fn.name, input.name || `param${idx}`, e.target.value)}
                                  className="bg-slate-700 border-slate-600 text-white flex-1 min-w-[150px]"
                                />
                              ))}
                              <Button 
                                onClick={() => callFunction(fn)} 
                                disabled={executingFunction === fn.name}
                                variant="secondary"
                                size="sm"
                              >
                                {executingFunction === fn.name ? '...' : fn.name}
                              </Button>
                            </div>
                            {functionResults[fn.name] && (
                              <p className="text-lg font-bold text-emerald-400 break-all">
                                {functionResults[fn.name]}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Write Functions */}
                    {writeFunctions.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                          Write Functions
                        </h3>
                        {writeFunctions.map((fn) => (
                          <div key={fn.name} className="space-y-2 p-3 bg-slate-700/50 rounded-lg">
                            {fn.inputs.map((input, idx) => (
                              <Input
                                key={`${fn.name}-${input.name || idx}`}
                                placeholder={`${input.name || `param${idx}`} (${input.type})`}
                                value={functionInputs[fn.name]?.[input.name || `param${idx}`] || ''}
                                onChange={(e) => handleInputChange(fn.name, input.name || `param${idx}`, e.target.value)}
                                className="bg-slate-700 border-slate-600 text-white"
                              />
                            ))}
                            <Button 
                              onClick={() => callFunction(fn)} 
                              disabled={executingFunction === fn.name}
                              className="w-full"
                            >
                              {executingFunction === fn.name ? '...' : fn.name}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {txHash && (
                  <div className="p-3 bg-emerald-900/30 border border-emerald-700 rounded-lg">
                    <p className="text-xs text-emerald-400 break-all">
                      TX: {txHash}
                    </p>
                  </div>
                )}
                
                {error && (
                  <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Code Tab */}
          <TabsContent value="code">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-sm">Generated React Component</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={copyCode}
                    className="text-slate-400 hover:text-white"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span className="ml-2">{copied ? 'Copied!' : 'Copy'}</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] w-full rounded-md border border-slate-700">
                  <pre className="p-4 text-xs text-slate-300 font-mono whitespace-pre-wrap">
                    {previewData.frontendCode}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
