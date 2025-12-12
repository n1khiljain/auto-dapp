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

// Helper: Get wallet (deferred initialization)
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

// Helper: Delete file (cleanup)
const deleteFile = (filePath: string) => {
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

app.post("/deploy", async (req, res) => {
  const { prompt } = req.body;
  const jobId = Date.now().toString();
  const contractFileName = `GenContract${jobId}.sol`;
  const contractPath = path.join(__dirname, "contracts", contractFileName);

  console.log(`[Job ${jobId}] Received prompt: ${prompt}`);

  try {
    // --- 1. AI GENERATION ---
    console.log(`[Job ${jobId}] Generating code...`);
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an expert Solidity developer. 
          1. Write a secure smart contract based on the user's prompt. 
          2. Use Solidity version ^0.8.20. 
          3. If helpful, import OpenZeppelin contracts (e.g., @openzeppelin/contracts/token/ERC20/ERC20.sol).
          4. Return ONLY the raw code. No markdown, no "here is your code", no backticks.`
        },
        { role: "user", content: prompt },
      ],
      model: "llama-3.3-70b-versatile",
    });

    let code = completion.choices[0].message.content || "";
    
    // Clean up markdown if the AI adds it despite instructions
    code = code.replace(/```solidity/g, "").replace(/```/g, "");
    
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

    // Cleanup
    deleteFile(contractPath);

    // --- 4. RESPONSE ---
    res.json({
      success: true,
      contractAddress: address,
      network: "Sepolia",
      explorerLink: `https://sepolia.etherscan.io/address/${address}`,
      code: code 
    });

  } catch (error: any) {
    console.error(`[Job ${jobId}] Failed:`, error);
    deleteFile(contractPath);
    res.status(500).json({ success: false, error: error.message || error });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

