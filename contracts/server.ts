import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import Groq from "groq-sdk";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Initialize Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const getWallet = () => {
  if (!process.env.SEPOLIA_RPC_URL) {
    throw new Error("SEPOLIA_RPC_URL is not set in .env");
  }
  if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY is not set in .env");
  }
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  return new ethers.Wallet(process.env.PRIVATE_KEY, provider);
};

const deleteFile = (filePath: string) => {
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

// Helper: Generate frontend code using TEMPLATE (much more reliable than AI)
const generateFrontendCode = (
  contractAddress: string,
  abi: any[],
): string => {
  // Filter to get only user-facing functions (exclude events, constructor, etc.)
  const functions = abi.filter(
    (item) => item.type === "function" && !item.name?.startsWith("_")
  );

  // Separate read (view/pure) and write functions
  const readFunctions = functions.filter(
    (f) => f.stateMutability === "view" || f.stateMutability === "pure"
  );
  const writeFunctions = functions.filter(
    (f) => f.stateMutability !== "view" && f.stateMutability !== "pure"
  );

  // Generate state declarations for inputs
  const generateInputStates = () => {
    const states: string[] = [];
    functions.forEach((fn) => {
      if (fn.inputs && fn.inputs.length > 0) {
        fn.inputs.forEach((input: any, idx: number) => {
          const inputName = input.name || `param${idx}`;
          states.push(`const [${fn.name}_${inputName}, set_${fn.name}_${inputName}] = useState("");`);
        });
      }
    });
    return states.join("\n  ");
  };

  // Generate state for read function results
  const generateResultStates = () => {
    return readFunctions
      .map((fn) => `const [${fn.name}Result, set_${fn.name}Result] = useState<string | null>(null);`)
      .join("\n  ");
  };

  // Generate a read function handler
  const generateReadHandler = (fn: any) => {
    const args = fn.inputs?.map((input: any, idx: number) => {
      const inputName = input.name || `param${idx}`;
      return `${fn.name}_${inputName}`;
    }).join(", ") || "";
    
    return `
  const call_${fn.name} = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const result = await contract.${fn.name}(${args});
      set_${fn.name}Result(result.toString());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };`;
  };

  // Generate a write function handler
  const generateWriteHandler = (fn: any) => {
    const args = fn.inputs?.map((input: any, idx: number) => {
      const inputName = input.name || `param${idx}`;
      return `${fn.name}_${inputName}`;
    }).join(", ") || "";
    
    return `
  const call_${fn.name} = async () => {
    if (!contract) return;
    setLoading(true);
    setError(null);
    try {
      const tx = await contract.${fn.name}(${args});
      await tx.wait();
      setTxHash(tx.hash);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };`;
  };

  // Generate input fields for a function
  const generateInputFields = (fn: any) => {
    if (!fn.inputs || fn.inputs.length === 0) return "";
    return fn.inputs.map((input: any, idx: number) => {
      const inputName = input.name || `param${idx}`;
      return `
              <Input
                placeholder="${inputName} (${input.type})"
                value={${fn.name}_${inputName}}
                onChange={(e) => set_${fn.name}_${inputName}(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />`;
    }).join("");
  };

  // Generate UI for read functions
  const generateReadUI = () => {
    if (readFunctions.length === 0) return "";
    return readFunctions.map((fn) => `
            <div className="space-y-2">
              <div className="flex gap-2 items-center">${generateInputFields(fn)}
                <Button onClick={call_${fn.name}} disabled={loading} variant="secondary" size="sm">
                  ${fn.name}
                </Button>
              </div>
              {${fn.name}Result && (
                <p className="text-2xl font-bold text-emerald-400">{${fn.name}Result}</p>
              )}
            </div>`).join("\n");
  };

  // Generate UI for write functions
  const generateWriteUI = () => {
    if (writeFunctions.length === 0) return "";
    return writeFunctions.map((fn) => `
            <div className="space-y-2">${generateInputFields(fn)}
              <Button onClick={call_${fn.name}} disabled={loading} className="w-full">
                {loading ? "..." : "${fn.name}"}
              </Button>
            </div>`).join("\n");
  };

  const template = `'use client';

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

const CONTRACT_ADDRESS = "${contractAddress}";
const CONTRACT_ABI = ${JSON.stringify(abi, null, 2)};

export default function ContractPage() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  
  // Input states
  ${generateInputStates()}
  
  // Result states
  ${generateResultStates()}

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
${readFunctions.map(generateReadHandler).join("")}
${writeFunctions.map(generateWriteHandler).join("")}

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
${generateReadUI()}
              
              {/* Write Functions */}
${generateWriteUI()}
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
`;

  return template;
};

// Helper: Write frontend to preview-frontend
const writeFrontendCode = (code: string) => {
  const frontendPath = path.join(__dirname, "..", "preview-frontend", "app", "page.tsx");
  fs.writeFileSync(frontendPath, code);
  console.log(`Frontend code written to ${frontendPath}`);
};

app.post("/deploy", async (req, res) => {
  const { prompt } = req.body;
  const jobId = Date.now().toString();
  const contractFileName = `GenContract${jobId}.sol`;
  const contractPath = path.join(__dirname, "contracts", contractFileName);

  console.log(`[Job ${jobId}] Received prompt: ${prompt}`);

  try {
    // --- 1. AI GENERATION (Smart Contract) ---
    console.log(`[Job ${jobId}] Generating smart contract code...`);
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an expert Solidity developer. Generate a working smart contract.

STRICT RULES:
1. ALWAYS start with: // SPDX-License-Identifier: MIT
2. ALWAYS use: pragma solidity ^0.8.20;
3. CRITICAL SOLIDITY RULES:
   - view/pure functions CANNOT emit events (events modify state)
   - view functions can only READ state, not modify it
   - If you need events, the function must NOT be view/pure
   - Getter functions should be simple: just return the value, no events
4. Keep contracts SIMPLE - don't over-engineer
5. Use OpenZeppelin only when necessary (ERC20, ERC721, Ownable)
6. NO constructor parameters - contract must deploy with no arguments
7. Return ONLY raw Solidity code. No markdown, no backticks, no explanations.

EXAMPLE STRUCTURE:
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MyContract {
    mapping(address => uint256) public values;
    
    function setValue(uint256 _value) external {
        values[msg.sender] = _value;
    }
    
    function getValue(address _user) external view returns (uint256) {
        return values[_user];
    }
}`
        },
        { role: "user", content: prompt },
      ],
      model: "llama-3.3-70b-versatile",
    });

    let code = completion.choices[0].message.content || "";
    
    // Clean up markdown if the AI adds it despite instructions
    code = code.replace(/```solidity/g, "").replace(/```/g, "").trim();
    
    // Ensure SPDX license is present
    if (!code.includes("SPDX-License-Identifier")) {
      code = "// SPDX-License-Identifier: MIT\n" + code;
    }
    
    // Ensure pragma is present
    if (!code.includes("pragma solidity")) {
      code = code.replace("// SPDX-License-Identifier: MIT", "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;");
    }
    
    // Ensure the contract name in the code matches our expectations
    code = code.replace(/contract \w+/, `contract GeneratedContract${jobId}`);

    fs.writeFileSync(contractPath, code);
    console.log(`[Job ${jobId}] Code saved to ${contractFileName}`);

    // --- 2. COMPILATION (Using Hardhat CLI) ---
    console.log(`[Job ${jobId}] Compiling...`);
    await new Promise((resolve, reject) => {
      exec("npx hardhat compile", (error, stdout, stderr) => {
        if (error) {
          console.error(`Compilation Error: ${stderr}`);
          reject(stderr);
        } else {
          resolve(stdout);
        }
      });
    });

    // --- 3. DEPLOYMENT ---
    console.log(`[Job ${jobId}] Deploying...`);
    
    // Read the compiled artifact
    const artifactPath = path.join(
      __dirname, 
      "artifacts", 
      "contracts", 
      contractFileName, 
      `GeneratedContract${jobId}.json`
    );
    
    if (!fs.existsSync(artifactPath)) {
      throw new Error("Compilation failed, artifact not found.");
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const wallet = getWallet();
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

    // Deploy
    const contract = await factory.deploy(); 
    await contract.waitForDeployment();
    
    const address = await contract.getAddress();
    console.log(`[Job ${jobId}] Deployed to: ${address}`);

    // --- 4. GENERATE FRONTEND ---
    console.log(`[Job ${jobId}] Generating interactive frontend...`);
    const frontendCode = generateFrontendCode(
      address,
      artifact.abi
    );
    writeFrontendCode(frontendCode);
    console.log(`[Job ${jobId}] Frontend generated successfully`);

    // Cleanup contract source (keep artifacts for reference)
    deleteFile(contractPath);

    // --- 5. RESPONSE ---
    res.json({
      success: true,
      contractAddress: address,
      network: "Sepolia",
      explorerLink: `https://sepolia.etherscan.io/address/${address}`,
      previewUrl: "http://localhost:3002",
      code: code,
      abi: artifact.abi,
    });

  } catch (error: any) {
    console.error(`[Job ${jobId}] Failed:`, error);
    deleteFile(contractPath);
    res.status(500).json({ success: false, error: error.message || error });
  }
});

// Endpoint to regenerate frontend only (useful for tweaking)
app.post("/regenerate-frontend", (req, res) => {
  const { contractAddress, abi } = req.body;
  
  try {
    console.log(`Regenerating frontend for ${contractAddress}...`);
    const frontendCode = generateFrontendCode(contractAddress, abi);
    writeFrontendCode(frontendCode);
    
    res.json({
      success: true,
      previewUrl: "http://localhost:3002",
    });
  } catch (error: any) {
    console.error("Frontend generation failed:", error);
    res.status(500).json({ success: false, error: error.message || error });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log(`Preview frontend should be running on http://localhost:3002`);
});
