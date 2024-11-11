# Discord Role Bot

A TypeScript-based Discord bot that automatically assigns roles to users based on their NFT badge ownership. The bot integrates with Privy for wallet-Discord account linking and OpenFormat for NFT badge verification.
    
## Features

- Verifies NFT badge ownership through OpenFormat subgraph queries
- Links wallet addresses to Discord accounts using Privy
- Automatically assigns Discord roles based on badge ownership
- RESTful API endpoint for role verification and assignment
- Comprehensive error handling and status reporting

## How It Works

Users submit their wallet address to the /VerifyAndRewardDiscordRole endpoint

The bot:

- Validates the wallet address format
- Checks if the wallet is linked to a Discord account via Privy
- Verifies NFT badge ownership through OpenFormat
- Assigns appropriate Discord roles if eligible

## Setup

Create a .env file with the following variables:

```
PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_secret
DISCORD_BOT_TOKEN=your_discord_bot_token
GUILD_ID=your_discord_server_id
OPENFORMAT_SUBGRAPH_URL=https://api.studio.thegraph.com/query/82634/open-format-aurora/version/latest //For Aurora Mainnet

```
Install dependencies:

```
npm install
```

Start the server:

```
npm start
```

## API Usage

Send a POST request to /VerifyAndRewardDiscordRole:

```
{
  "walletAddress": "0x1234..."
}
```

Response examples:

```
{
  "status": 200,
  "data": {
    "message": "Added Discord Role(s): ambassador"
  }
}
```

```
{
  "status": 200,
  "data": {
    "message": "Already has Discord Role(s): ambassador"
  }
}
```

## Role Configuration

Roles and their required badges are configured in the roleAccess array, the role must match a role that has been created in your Discord server, e.g.

``` 
const roleAccess = [
  {
    role: "Ambassador",
    badgeIdRequired: "0x10e9267ad0637584ab1a581d60336a1e7144fb5a",
  },
  {
    role: "Beta Tester",
    badgeIdRequired: "0x2a23408f7878adc4ecc6e16422b3f8307c91409a",
  }
];
```

## Technical Details

- Built with TypeScript and Express
- Uses Discord.js for Discord integration
- Integrates with Privy for wallet-Discord account linking
- Uses GraphQL for OpenFormat badge verification
- ESM module system
- Runs on Node.js

### Error Handling

The bot includes comprehensive error handling for:

- Invalid wallet addresses
- Missing Discord account links
- Badge verification failures
- Role assignment issues
- Server errors

Each error case returns appropriate HTTP status codes and descriptive messages.
