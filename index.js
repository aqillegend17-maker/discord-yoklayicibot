const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder
} = require("discord.js");

const mc = require("minecraft-server-util");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const commands = [
  new SlashCommandBuilder()
    .setName("testserver")
    .setDescription("TalkLand Minecraft serverini yoxla")
].map(command => command.toJSON());

client.once("ready", async () => {
  console.log(`${client.user.tag} online!`);

  const rest = new REST({ version: "10" })
    .setToken(process.env.DISCORD_TOKEN);

  try {
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log("Slash komanda qeydiyyatdan keçdi!");
  } catch (error) {
    console.error("Komanda qeydiyyatı xətası:", error);
  }
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "testserver") return;

  await interaction.deferReply();

  try {
    const result = await mc.status(
      "TalkLandBoxPVP.aternos.me",
      40781,
      { timeout: 10000 }
    );

    const embed = new EmbedBuilder()
      .setTitle("⚔️ TalkLand AI Tester")
      .setColor(0x2ecc71)
      .addFields(
        { name: "Server", value: "🟢 Əlaqə var", inline: true },
        {
          name: "Minecraft versiyası",
          value: result.version.name,
          inline: true
        },
        {
          name: "Oyunçular",
          value: `${result.players.online}/${result.players.max}`,
          inline: true
        }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    await interaction.editReply(
      "🔴 Serverə qoşulmaq mümkün olmadı. Server bağlı ola bilər və ya əlaqə vaxtı bitib."
    );
  }
});

client.login(process.env.DISCORD_TOKEN);
