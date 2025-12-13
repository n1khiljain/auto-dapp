"use client";

import react, {useState } from "react";
import { RocketIcon, CheckCircle2, Terminal, Loader2, Boxes } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Types for our state
type DeploymentStatus = "idle" | "deploying" | "success" | "error";

interface LogEntry {
  timestamp: string;
  message: string;
}

interface DeploymentResult {
  contractAddress: string;
  explorerLink: string;
  network: string;
  previewUrl: string;
}

export default function Home() {
  // --- Application State ---
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<DeploymentStatus>("idle");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<DeploymentResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Helper to add logs with timestamps
  const addLog = (message: string) => {
    setLogs((prev) => [
      ...prev,
      { timestamp: new Date().toLocaleTimeString(), message },
    ]);
  };

 
  const simulateDeploymentAPI = async (promptText: string) => {
    setStatus("deploying");
    setLogs([]);
    setResult(null);
    setErrorMessage("");

    try {
      const response = await fetch("http://localhost:4000/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      addLog("Deployment complete!");
      setResult({
        contractAddress: data.contractAddress,
        explorerLink: data.explorerLink,
        network: "Sepolia Testnet",
        previewUrl: data.previewUrl || "http://localhost:3002",
      });
      setStatus("success");

    } catch (error: any) {
      addLog(`Error: ${error.message}`);
      setStatus("error");
      setErrorMessage(error.message);
    }
  }
      

  const handleDeploy = () => {
    if (!prompt.trim()) return;
    simulateDeploymentAPI(prompt);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 sm:p-24">
      <div className="z-10 w-full max-w-4xl items-center justify-between font-mono text-sm lg:flex lg:flex-col lg:gap-8">
        
        {/* Header Section */}
        <div className="mb-8 text-center lg:mb-0">
          <h1 className="text-4xl font-bold tracking-tighter flex items-center justify-center gap-3">
            AI DApp Deployer
          </h1>
          <p className="mt-4 text-muted-foreground text-lg">
            Describe your decentralized application, and AI will build and deploy it to Ethereum.
          </p>
        </div>

        <div className="grid w-full gap-8 md:grid-cols-2">
          
          {/* Left Column: Input Form */}
          <Card className="w-full h-fit">
            <CardHeader>
              <CardTitle>Concept Prompt</CardTitle>
              <CardDescription>
                Be specific about features, tokenomics, or logic.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-3">
                  <Label htmlFor="prompt">Your Idea</Label>
                  <Textarea
                    id="prompt"
                    placeholder="e.g., Create an ERC-20 token named 'FutureCoin' (FUTR) with a total supply of 1 million. Add a function allowing the owner to mint more."
                    className="min-h-[200px] text-base"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={status === "deploying"}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Badge variant="outline" className="px-4 py-1">target: Sepolia Testnet</Badge>
              <Button
                onClick={handleDeploy}
                disabled={status === "deploying" || !prompt.trim()}
                className="w-40"
              >
                {status === "deploying" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Building...
                  </>
                ) : (
                  <>
                    Generate & Deploy
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Right Column: Status & Results */}
          <div className="flex flex-col gap-4">
            
            {/* Deployment Logs Console */}
            <Card className="w-full flex flex-col h-[400px]">
               <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Terminal className="h-5 w-5" />
                  Deployment Console
                </CardTitle>
                 <Separator className="mt-2"/>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full max-h-[320px] w-full p-4">
                  {logs.length === 0 ? (
                    <span className="text-muted-foreground italic">Waiting for input...</span>
                  ) : (
                    <div className="flex flex-col gap-2 font-mono text-sm">
                      {logs.map((log, index) => (
                        <div key={index} className="flex gap-2">
                          <span className="text-muted-foreground">[{log.timestamp}]</span>
                          <span className={index === logs.length - 1 && status === 'deploying' ? 'animate-pulse text-primary' : ''}>
                             {log.message}
                          </span>
                        </div>
                      ))}
                       <div id="log-end" /> 
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Success Alert */}
            {status === "success" && result && (
              <Alert variant="default" className="border-green-500 bg-green-50 text-green-900">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Deployment Successful!</AlertTitle>
                <AlertDescription className="mt-2 flex flex-col gap-2">
                    <p>Your DApp is live on the {result.network}.</p>
                    <div className="font-mono bg-white/50 p-2 rounded border border-green-200 break-all">
                        {result.contractAddress}
                    </div>
                    <div className="flex gap-4 mt-2">
                      <Button variant="outline" asChild className="flex-1 border-green-600 text-green-700 hover:bg-green-100">
                        <a href={result.previewUrl} target="_blank" rel="noopener noreferrer">
                            🚀 Open Preview App
                        </a>
                      </Button>
                      <Button variant="link" asChild className="text-green-700">
                        <a href={result.explorerLink} target="_blank" rel="noopener noreferrer">
                            View on Etherscan ↗
                        </a>
                      </Button>
                    </div>
                </AlertDescription>
              </Alert>
            )}

             {/* Error Alert */}
             {status === "error" && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
