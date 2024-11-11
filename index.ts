import express, { Request, Response } from "express";
import { Client, GatewayIntentBits } from "discord.js";
import { PrivyClient } from "@privy-io/server-auth";
import axios from "axios";

// Environment Variables
const botToken = process.env["DISCORD_TOKEN"];
const apiKey = process.env["OPENFORMAT_API_KEY"];
const privyAppSecret = process.env["PRIVY_APP_SECRET"];
const privyAppId = process.env["PRIVY_APP_ID"];

// Role Data - Currently just ambassador badge
const roleAccess = [
  {
    role: "ambassador",
    badgeIdRequired: "0x10e9267ad0637584ab1a581d60336a1e7144fb5a",
  },
];

// Set up Privy client
if (!privyAppId || !privyAppSecret) {
  throw new Error(
    "PRIVY_APP_ID or PRIVY_APP_SECRET environment variable is not set",
  );
}

const privyClient = new PrivyClient(privyAppId, privyAppSecret);

//Setup Discord client

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user?.tag}!`);
});

client.login(botToken);

// Handle webhook logic
const app = express();
app.use(express.json());

app.post("/webhook", async (req: Request, res: Response): Promise<void> => {
  // Verify Webhook
  /*  const signature = req.headers['x-openformat-signature'] as string;

    res.json({
        "challenge": signature
    });
    */

   try {
      const { event, payload } = req.body;

      // Ensure it's the correct event type
      if (event !== "transaction") {
        res.status(400).json({ error: "Invalid event type" });
        return
      }

      const walletAddress = payload.to; // Extract wallet address from 'to' field
      console.log(walletAddress);
      if (!walletAddress) {
        res.status(400).json({ error: "Wallet address not provided" });
        return
      }

      // Call main function with walletAddress
      await main(walletAddress);
      res.status(200).json({ message: "Role check triggered" });
    } catch (error) {
      console.error("Error handling webhook:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});


async function main(walletAddress: string) {

  const discordUser = await getDiscordUser(walletAddress);

  if (discordUser) {
    for (const { role, badgeIdRequired } of roleAccess) {
      const hasRole = await checkUserRole(discordUser, role);
      if (hasRole) {
        console.log(`${discordUser} has ${role} role.`);
      } else {
        const hasBadge = await checkUserBadge(walletAddress, badgeIdRequired);
        if (hasBadge) {
          await assignRoleToUser(discordUser, role);
          console.log(`User has been assigned the ${role} role.`);
        } else {
          console.log(`User ${discordUser} does not have the badge or role`);
        }
      }
    }
  } else {
    console.log("User not found or Discord ID not linked.");
  }
}


// GET DISCORD USERNAME FROM WALLET ADDRESS USING PRIVY
async function getDiscordUser(walletAddress: string): Promise<string | null> {
  try {
    // Return Privy user object
    const user = await privyClient.getUserByWalletAddress(walletAddress);

    if (user && user.discord) {
      const discordName = user.discord.username;
      return discordName;
    } else {
      console.log("User not found or Discord ID not linked.");
      return null;
    }
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
}


// CHECK WHETHER USER HAS ROLE
async function checkUserRole(
  discordUser: string,
  roleName: string,
): Promise<boolean> {
  try {
    // Fetch the guild by its ID
    const guildId = process.env["GUILD_ID"];
    if (!guildId) {
      throw new Error("GUILD_ID environment variable is not set");
    }

    const guild = await client.guilds.fetch(guildId);
    if (!guild) throw new Error("Guild not found");

    const usernameWithoutDiscriminator = discordUser.split("#")[0];

    // Fetch all members in the guild to find the user by username
    await guild.members.fetch();
    const member = guild.members.cache.find(
      (m) => m.user.username === usernameWithoutDiscriminator,
    );

    if (!member) throw new Error("User not found in the guild");

    // Retrieve and return the user's roles as an array of role names
    return member.roles.cache.some((role) => role.name === roleName);
  } catch (error) {
    console.error(error);
    return false;
  }
}


// CHECK WHETHER USER HAS BADGE
async function checkUserBadge(
  walletAddress: string,
  badgeId: string,
): Promise<boolean> {
  const dappId = process.env["DAPP_ID"];

  if (!dappId) {
    throw new Error("DAPP_ID environment variable is not set");
  }

  const queryParams = {
    app_id: dappId.toLowerCase(),
    user_id: walletAddress.toLowerCase(),
    chain: "arbitrum-sepolia",
  };

  const axiosConfig = {
    method: "GET",
    url: "https://api.openformat.tech/v1/profile",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    params: queryParams,
  };

  const apiResponse = await axios(axiosConfig);
  const hasBadge = apiResponse.data?.collected_badges.length
    ? apiResponse.data.collected_badges.some(
        (badge: { id: string }) => badge.id === badgeId,
      )
    : false;

  return hasBadge;
}


// ASSIGN A ROLE TO A USER
async function assignRoleToUser(discordUser: string, roleName: string): Promise<void> {
    try {
      const guildId = process.env["GUILD_ID"];
      if (!guildId) {
        throw new Error("GUILD_ID environment variable is not set");
      }

      const guild = await client.guilds.fetch(guildId);
      if (!guild) throw new Error("Guild not found");

      // Fetch the role by name
      const role = guild.roles.cache.find((r) => r.name === roleName);
      if (!role) throw new Error(`Role "${roleName}" not found in the guild`);

      const usernameWithoutDiscriminator = discordUser.split("#")[0];
      await guild.members.fetch();
      const member = guild.members.cache.find((m) => m.user.username === usernameWithoutDiscriminator);

      if (!member) throw new Error("User not found in the guild");

      // Add the role to the user
      await member.roles.add(role);
      console.log(`Role "${roleName}" assigned to user ${discordUser}`);
    } catch (error) {
      console.error(`Failed to assign role "${roleName}" to user ${discordUser}:`, error);
    }
  }
