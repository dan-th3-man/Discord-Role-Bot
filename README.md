# Discord Token-Gated Roles
A Discord bot that automatically assigns roles to users based on their NFT ownership. 

    
## Features

- 🔑 Verifies the NFT's a user has been awarded via OpenFormat using OpenFormat's subgraph
- Checks if a Discord account is linked to the wallet addresses using Privy and returns the Discord username
- Automatically assigns Discord roles based on badge ownership
- RESTful API endpoint for role verification and assignment
- Comprehensive error handling and status reporting

## How It Works

Users submit their wallet address to the /roles/verify endpoint

The bot:

- Validates the wallet address format
- Checks if the wallet is linked to a Discord account via Privy
- Verifies NFT badge ownership through OpenFormat
- Assigns appropriate Discord roles if eligible

## Getting Started

### Prerequisites
Before you begin, you'll need to set up accounts and configure a few services:

1. **Discord Application**



2. **Privy Dashboard**
   - Create an account at [Privy Dashboard](https://dashboard.privy.io)
   - Create a new app to get your `PRIVY_APP_ID` and `PRIVY_APP_SECRET` from the Settings section of your Privy app
   - In the Login Methods section of your Privy app, enable:
     - Discord
     - Email

### Local Development

1. Clone the repository:

```
git clone https://github.com/openformat/discord-bot.git
cd discord-bot
```

2. Install dependencies:

```
npm install
```

3. Create a `.env.local` file in the root directory with the following variables:

```
PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_secret
DISCORD_BOT_TOKEN=your_discord_bot_token
GUILD_ID=your_discord_server_id
```

4. Start the server:

```
npm run dev
```

5. Test the bot by sending a POST request to /roles/verify

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
## Environment Variables
| Variable                   | Required | Example                                      | Description                                                                                                                                          |
| -------------------------- | -------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PRIVY_APP_ID` | Yes      | `cgg24287yq0273ryeh719gutpc`                 | Your [Privy](https://privy.io) application ID.                                                                                                        |
| `PRIVY_APP_SECRET`       | Yes       | `b31e8e6c-d43b-4b37-aee9-621egg415b8e`       | Your [Privy](https://privy.io) application secret. |
| `GUILD_ID`       | Yes       | `994570291395174421` | Required to view and assign roles in your Discord server. You can find this in your Discord server settings or URL.       |
| `DISCORD_BOT_TOKEN`       | Yes       | `MTA1NzY5NDQ5MDk5NzM5MTM4MA.GqFoTp.4vIwE` | Your Discord Bot Token. Create one in the [Discord Developer Portal](https://discord.com/developers/applications).      |



## Contributing
Contributions are welcome! Please feel free to submit an issue.