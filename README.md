# Discord Token-Gated Roles
A Discord bot that automatically assigns roles to users based on their NFT ownership. 


## How It Works

A wallet address is sent to the /roles/verify endpoint as a POST request.

The bot:

- 🔗 Checks if the wallet is linked to a Discord account via Privy
- 🔍 Verifies NFT ownership through OpenFormat and their Subgraph
- 🎉 Assigns appropriate Discord roles if eligible

## Getting Started

### Prerequisites
Before you begin, you'll need to set up accounts and configure a few services:

**Discord Application**
1. Create a New Application:
- Go to the [Discord Developer Portal](https://discord.com/developers/applications) and click New Application.
- Name your application and click Create.

2. Set Up a Bot:
- Navigate to the Bot tab in your application.
- Click Add Bot and confirm.
- Customize your bot’s username, profile picture, and token permissions.

3. Server Members Intent:
- Navigate to the Bot section on the left
- Scroll down to Privileged Gateway Intents
- Enable Server Members Intent and save.

4. Permissions:
- Under OAuth2 > URL Generator, select 'bot' and 'applications.commands' scopes.
- Under OAuth2 > URL Generator > Bot Permissions, select the following:
    - View Channels
    - Manage Roles
    - Send Messages (if the bot needs to respond in chat)
- Copy the generated URL, paste it into a browser, and add the bot to your server.

5. Token:
- In the Bot section, click Reset Token to generate a token.
- Copy this token and store it in ```.env``` file as DISCORD_BOT_TOKEN

6. Guild ID:
- You can find this in your Discord server settings or URL, e.g. 932238833146277958
- Add this to the ```.env``` file as GUILD_ID


**Privy Dashboard**
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
OPENFORMAT_SUBGRAPH_URL=https://api.studio.thegraph.com/query/82634/open-format-aurora/version/latest
```
4. Add roles and required NFT's to ```index.ts```

The Discord roles and the required NFT's addresses are configured in the roleAccess array. 

The role must match a role that has been created in your Discord server, and the NFT must have been rewarded via OpenFormat. 

For example:

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

5. Start the server:

```
npm run dev
```

6. Test the bot by sending a POST request to /roles/verify

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

## Environment Variables
| Variable                   | Required | Example                                      | Description                                                                                                                                          |
| -------------------------- | -------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PRIVY_APP_ID` | Yes      | `cgg24287yq0273ryeh719gutpc`                 | Your [Privy](https://privy.io) application ID.                                                                                                        |
| `PRIVY_APP_SECRET`       | Yes       | `b31e8e6c-d43b-4b37-aee9-621egg415b8e`       | Your [Privy](https://privy.io) application secret. |
| `GUILD_ID`       | Yes       | `994570291395174421` | Required to view and assign roles in your Discord server. You can find this in your Discord server settings or URL.       |
| `DISCORD_BOT_TOKEN`       | Yes       | `MTA1NzY5NDQ5MDk5NzM5MTM4MA.GqFoTp.4vIwE` | Your Discord Bot Token. Create one in the [Discord Developer Portal](https://discord.com/developers/applications).      |
| `OPENFORMAT_SUBGRAPH_URL` | Yes      | `https://api.studio.thegraph.com/query/82634/open-format-aurora/version/latest` | The URL for the OpenFormat subgraph used to verify NFT ownership. |



## Contributing
Contributions are welcome! Please feel free to submit an issue.