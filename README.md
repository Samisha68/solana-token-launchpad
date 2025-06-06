# SolToken - Solana Token Platform

A comprehensive platform for creating, selling, and distributing tokens on Solana with built-in verification and custom rules.

## Features

### 🪙 Token Creation
- Create SPL tokens with custom parameters
- Set token name, symbol, decimals, and initial supply
- Upload token images
- Mint tokens directly to your wallet

### 💰 Token Sales
- Create token sales with custom pricing in USDC
- Set sale duration with start and end times
- Configure minimum and maximum purchase limits
- Implement vesting periods for purchased tokens
- Require identity verification for participation

### 🎁 Free Token Distributions
- Distribute free tokens to eligible users
- Set custom eligibility rules
- Require verification through Reclaim Protocol or Solana Attestations
- Track distribution progress and claims

### 🔐 Verification Systems
- **Reclaim Protocol**: Verify social media accounts, GitHub profiles, Discord membership, etc.
- **Solana Attestations**: Use on-chain attestations for verification
- Custom eligibility rules with flexible conditions

### 🎨 Modern UI/UX
- Built with Next.js 14 and TypeScript
- Styled with Tailwind CSS and shadcn/ui components
- Responsive design for all devices
- Dark mode support

## Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Blockchain**: Solana Web3.js + SPL Token
- **Wallet Integration**: Solana Wallet Adapter
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A Solana wallet (Phantom, Solflare, etc.)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sol-token-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Configuration

The application is configured to use Solana Devnet by default. To change the network:

1. Edit `src/components/WalletProvider.tsx`
2. Change the `network` variable to your desired network:
   - `WalletAdapterNetwork.Devnet` (default)
   - `WalletAdapterNetwork.Testnet`
   - `WalletAdapterNetwork.Mainnet`

## Usage

### Creating a Token

1. Connect your Solana wallet
2. Navigate to "Create Token"
3. Fill in token details:
   - Name and symbol
   - Decimals (default: 6)
   - Initial supply
   - Description (optional)
   - Token image (optional)
4. Submit the form to create your token

### Setting Up a Token Sale

1. Ensure you have created a token first
2. Navigate to "Token Sales" → "Create Sale"
3. Configure sale parameters:
   - Select your token
   - Set price per token in USDC
   - Define sale duration
   - Set purchase limits (optional)
   - Configure vesting period (optional)
   - Enable verification requirements (optional)
4. Submit to create the sale

### Creating a Distribution

1. Navigate to "Free Distributions"
2. Click "Create Distribution"
3. Set up distribution parameters:
   - Select your token
   - Set total tokens to distribute
   - Choose verification method
   - Define eligibility rules
   - Set distribution timeframe
4. Submit to create the distribution

### Verification Rules

Eligibility rules use a simple syntax:

```
github.followers > 100
twitter.verified = true
discord.member_since < 2023-01-01
```

Supported operators: `>`, `<`, `>=`, `<=`, `=`, `!=`

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── create-token/      # Token creation page
│   ├── token-sales/       # Token sales page
│   ├── distributions/     # Distributions page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── CreateTokenForm.tsx
│   ├── CreateTokenSaleForm.tsx
│   ├── Navigation.tsx
│   ├── WalletButton.tsx
│   └── WalletProvider.tsx
├── lib/                  # Utility functions
│   └── utils.ts
├── services/             # Business logic
│   ├── solana.ts        # Solana blockchain interactions
│   └── verification.ts   # Verification services
└── store/               # Zustand state management
    ├── useTokenStore.ts
    └── useWalletStore.ts
```

## Development

### Key Components

- **SolanaService**: Handles all blockchain interactions
- **VerificationService**: Manages identity verification
- **Token Store**: Manages token, sale, and distribution state
- **Wallet Store**: Manages wallet connection state

### Adding New Features

1. Create new components in `src/components/`
2. Add business logic to `src/services/`
3. Update state management in `src/store/`
4. Create new pages in `src/app/`

## Security Considerations

⚠️ **Important**: This is a demo application. For production use:

1. Implement proper program deployment and interaction
2. Add comprehensive error handling
3. Implement proper access controls
4. Add transaction confirmation flows
5. Implement proper key management
6. Add comprehensive testing
7. Audit smart contracts

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or support, please open an issue on GitHub.

---

Built with ❤️ for the Solana ecosystem
