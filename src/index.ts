import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response } from "express";
import { Client, GatewayIntentBits } from "discord.js";
import { PrivyClient } from "@privy-io/server-auth";
import type { Address } from "viem";
import { gql, request } from "graphql-request";


// Role Data - Currently just ambassador badge
const roleAccess = [
  {
    role: "ambassador",
    badgeIdRequired: "0xe6e976dd96bca7da4f1e2d2bb1ba11e2b500d85a",
  },
];

// Set up Privy client
if (!process.env.PRIVY_APP_ID || !process.env.PRIVY_APP_SECRET) {
  throw new Error("Missing Privy environment variables");
}

const privyClient = new PrivyClient(
  process.env.PRIVY_APP_ID as string,
  process.env.PRIVY_APP_SECRET as string
);


// Set up Discord client
const discordClient = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

discordClient.once("ready", () => {
  console.log(`Logged in as ${discordClient.user?.tag}!`);
});

discordClient.login(process.env.DISCORD_BOT_TOKEN as string);

// Set up API endpoint
const app = express();
app.use(express.json());

app.post("/VerifyAndRewardDiscordRole", async (req: Request, res: Response): Promise<void> => {
  try {
    const { walletAddress } = req.body;

    // Validate input format
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      res.status(400).json({ message: "Invalid wallet address format" });
      return;
    }

    const result = await main(walletAddress as `0x${string}`);
    res.status(200).json({ message: result.message });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});


// MAIN FUNCTION
async function main(walletAddress: `0x${string}`): Promise<{ message: string }> {
  const discordUser = await getDiscordUser(walletAddress);

  if (!discordUser) {
    return { 
      message: "No Discord account linked to this wallet", 
    };
  }

  let rolesAdded: string[] = [];
  let rolesAlreadyHad: string[] = [];
  let rolesNotEligible: string[] = [];

  for (const { role, badgeIdRequired } of roleAccess) {
    const hasRole = await checkUserRole(discordUser, role);
    if (hasRole) {
      rolesAlreadyHad.push(role);
    } else {
      const hasBadge = await checkUserBadgeBool(walletAddress, badgeIdRequired);
      if (hasBadge) {
        await assignRoleToUser(discordUser, role);
        rolesAdded.push(role);
      } else {
        rolesNotEligible.push(role);
      }
    }
  }

  // Build response message
  const messageParts: string[] = [];
  
  if (rolesAdded.length > 0) {
    messageParts.push(`Added Discord Role(s): ${rolesAdded.join(", ")}`);
  }
  if (rolesAlreadyHad.length > 0) {
    messageParts.push(`Already has Discord Role(s): ${rolesAlreadyHad.join(", ")}`);
  }
  if (rolesNotEligible.length > 0) {
    messageParts.push(`Not eligible for Discord Role(s): ${rolesNotEligible.join(", ")}`);
  }

  return { 
    message: messageParts.length > 0 ? messageParts.join(". ") : "No role changes needed",
  };
}


// GET DISCORD USERNAME FROM WALLET ADDRESS USING PRIVY
async function getDiscordUser(walletAddress: Address): Promise<string | null> {
  try {
    // Return Privy user object
    const user = await privyClient.getUserByWalletAddress(walletAddress);

    if (user?.discord?.username) {
      return user.discord.username;
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

    const guild = await discordClient.guilds.fetch(guildId);
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
async function checkUserBadgeBool(
  walletAddress: string,
  badgeId: string,
): Promise<boolean> {

  if (!process.env.OPENFORMAT_SUBGRAPH_URL) {
    return false;
  }

  
  const checkBadges = gql`
    query CheckBadges($walletAddress: ID!) {
      users(where: {id: $walletAddress}) {
        collectedBadges {
          badge {
            id
            name
          }
        }
      }
    }
  `;

  try {
    const response = await request<BadgeResponse>(
      process.env.OPENFORMAT_SUBGRAPH_URL,
      checkBadges,
      {
        walletAddress: walletAddress.toLowerCase(),
      }
    );
  console.log(response);
    
    if (!response.users || response.users.length === 0) {
      console.log(`No user found for wallet address: ${walletAddress}`);
      return false;
    }

    const hasBadge = response.users[0]?.collectedBadges.some(
      (collected: { badge: { id: string } }) => collected.badge.id === badgeId.toLowerCase()
    );

    return hasBadge || false;
  } catch (error) {
    console.error("Error checking user badge:", error);
    return false;
  }
}

// ASSIGN A ROLE TO A USER
async function assignRoleToUser(discordUser: string, roleName: string): Promise<void> {
    try {
      const guildId = process.env["GUILD_ID"];
      if (!guildId) {
        throw new Error("GUILD_ID environment variable is not set");
      }

      const guild = await discordClient.guilds.fetch(guildId);
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

interface BadgeResponse {
  users: {
    collectedBadges: {
      badge: {
        id: string;
        name: string;
      };
    }[];
  }[];
}
