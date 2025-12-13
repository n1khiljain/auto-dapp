# AI DApp Deployer 🚀

An AI-powered tool that generates, compiles, deploys, and creates interactive UIs for smart contracts on Ethereum — all from a simple text prompt.

![Demo](https://img.shields.io/badge/Network-Sepolia-blue) ![License](https://img.shields.io/badge/License-MIT-green)

## ✨ What It Does

1. **Describe your idea** → "Create a counter contract" or "Make an ERC-20 token"
2. **AI generates** the Solidity smart contract
3. **Automatically compiles** using Hardhat
4. **Deploys to Sepolia** testnet
5. **Generates an interactive UI** so you can use your contract immediately

## 🎬 Demo

```
You: "Create a simple voting contract with 3 candidates"
     ↓
AI generates Solidity contract
     ↓
Compiles & deploys to Sepolia
     ↓
Interactive voting UI generated
     ↓
Connect wallet & vote!
```

## 📁 Project Structure

```
auto-dapp/
├── contracts/           # Backend + Hardhat
│   ├── server.ts        # Express API server
│   ├── contracts/       # Generated .sol files
│   └── hardhat.config.cts
│
├── web/                 # Main frontend (Next.js)
│   └── app/page.tsx     # User input interface
│
└── preview-frontend/    # Generated contract UI (Next.js)
    └── app/page.tsx     # Auto-generated interactive UI
```

## 🛠️ Setup

### Prerequisites

- Node.js 18+
- MetaMask wallet
- Sepolia ETH (for gas fees)

### 1. Clone & Install

```bash
git clone https://github.com/n1khiljain/auto-dapp.git
cd auto-dapp

# Install dependencies for each folder
cd contracts && npm install && cd ..
cd web && npm install && cd ..
cd preview-frontend && npm install && cd ..
```

### 2. Configure Environment

Create `contracts/.env`:

```env
GROQ_API_KEY=your_groq_api_key
PRIVATE_KEY=your_wallet_private_key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_infura_key
```

Get your keys:
- **GROQ_API_KEY**: [console.groq.com](https://console.groq.com)
- **SEPOLIA_RPC_URL**: [infura.io](https://infura.io) or [alchemy.com](https://alchemy.com)
- **PRIVATE_KEY**: Export from MetaMask (use a dev wallet!)

### 3. Get Sepolia ETH

Get free testnet ETH from:
- [sepoliafaucet.com](https://sepoliafaucet.com)
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com)

## 🚀 Running the App

Open **3 terminals**:

### Terminal 1 - Backend API (Port 4000)
```bash
cd contracts
npx ts-node server.ts
```

### Terminal 2 - Main Web App (Port 3000)
```bash
cd web
npm run dev
```

### Terminal 3 - Preview Frontend (Port 3002)
```bash
cd preview-frontend
npm run dev
```

### Access the App

| Service | URL |
|---------|-----|
| Main App | http://localhost:3000 |
| Preview UI | http://localhost:3002 |
| Backend API | http://localhost:4000 |

## 💡 Example Prompts

Try these in the main app:

```
✅ "Create a simple counter that anyone can increment"

✅ "Make a tip jar where people can send ETH and the owner can withdraw"

✅ "Create a voting contract with 3 options: Pizza, Burger, Sushi"

✅ "Build a storage contract where users can save a string message"

✅ "Create an ERC-20 token called TestCoin with symbol TEST"
```

## 🏗️ How It Works

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Web App   │────▶│   Backend   │────▶│   Sepolia   │
│  (Next.js)  │     │  (Express)  │     │  (Testnet)  │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │
      │                   ▼
      │             ┌─────────────┐
      │             │    Groq     │
      │             │  (LLaMA AI) │
      │             └─────────────┘
      │                   │
      │                   ▼
      │             ┌─────────────┐
      └────────────▶│  Preview UI │
                    │  (Next.js)  │
                    └─────────────┘
```

1. User enters prompt in **Web App**
2. **Backend** sends prompt to Groq AI (LLaMA 3.3 70B)
3. AI generates Solidity code
4. **Hardhat** compiles the contract
5. **Backend** deploys to Sepolia using ethers.js
6. **Template generator** creates interactive UI
7. UI is written to **Preview Frontend**
8. User interacts with deployed contract!

## 🔧 Tech Stack

| Layer | Technology |
|-------|------------|
| AI | Groq (LLaMA 3.3 70B) |
| Smart Contracts | Solidity, Hardhat |
| Backend | Express, TypeScript |
| Frontend | Next.js 14, React, Tailwind CSS |
| UI Components | shadcn/ui |
| Blockchain | Ethereum (Sepolia Testnet) |
| Web3 | ethers.js v6 |

## ⚠️ Limitations

- **Testnet only** - Configured for Sepolia, not mainnet
- **No constructor args** - Generated contracts deploy without parameters
- **Simple contracts** - Complex DeFi protocols may not work perfectly
- **Local only** - Preview frontend writes to filesystem (not deployable as-is)

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a PR

## 📄 License

MIT License - feel free to use this for your own projects!

---

Built with ❤️ using AI

