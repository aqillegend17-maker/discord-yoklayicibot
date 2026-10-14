require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    REST,
    Routes,
    EmbedBuilder
} = require("discord.js");

const mc = require("minecraft-server-util");

// TalkLand AI Tester
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const SERVER_HOST = "TalkLandBoxPVP.aternos.me";
const SERVER_PORT = 40781;

const commands = [
    new SlashCommandBuilder()
        .setName("testserver")
        .setDescription("TalkLand Minecraft serverini yoxla"),

    new SlashCommandBuilder()
        .setName("testerinfo")
        .setDescription("TalkLand AI Tester haqqında məlumat ver")
].map(command => command.toJSON());

client.once("ready", async () => {
    console.log(`✅ ${client.user.tag} online oldu!`);

    try {
        const rest = new REST({ version: "10" })
            .setToken(process.env.DISCORD_TOKEN);

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            { body: commands }
        );

        console.log("✅ Slash komandalar qeydiyyatdan keçdi!");
    } catch (error) {
        console.error("❌ Komanda qeydiyyatı xətası:", error);
    }
});

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "testerinfo") {
        const embed = new EmbedBuilder()
            .setColor(0x3498db)
            .setTitle("⚔️ TalkLand AI Tester")
            .setDescription(
                "Minecraft serverinin vəziyyətini yoxlayan test botu!"
            )
            .addFields(
                {
                    name: "🎮 Server",
                    value: `${SERVER_HOST}:${SERVER_PORT}`
                },
                {
                    name: "🔍 Komandalar",
                    value: "`/testserver` — serverin vəziyyətini yoxla\n`/testerinfo` — bot haqqında məlumat"
                }
            )
            .setFooter({ text: "TalkLand BoxPVP" });

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }

    if (interaction.commandName === "testserver") {
        await interaction.deferReply();

        try {
            const start = Date.now();

            const result = await mc.status(
                SERVER_HOST,
                SERVER_PORT,
                { timeout: 10000 }
            );

            const responseTime = Date.now() - start;

            const embed = new EmbedBuilder()
                .setColor(0x2ecc71)
                .setTitle("⚔️ TalkLand Server Testi")
                .setDescription("🟢 Server sorğuya cavab verdi!")
                .addFields(
                    {
                        name: "🎮 Minecraft versiyası",
                        value: String(result.version.name),
                        inline: true
                    },
                    {
                        name: "👥 Oyunçular",
                        value: `${result.players.online}/${result.players.max}`,
                        inline: true
                    },
                    {
                        name: "⚡ Cavab müddəti",
                        value: `${responseTime} ms`,
                        inline: true
                    }
                )
                .setTimestamp()
                .setFooter({ text: "TalkLand AI Tester" });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("Server testi xətası:", error);

            const embed = new EmbedBuilder()
                .setColor(0xe74c3c)
                .setTitle("🔴 Serverə cavab alınmadı")
                .setDescription(
                    "Server bağlı ola bilər, Aternos serveri hələ başlamamış ola bilər və ya əlaqə vaxtı bitib."
                )
                .addFields({
                    name: "📌 Yoxla",
                    value:
                        "• Aternos-da serverin işlədiyini yoxla.\n" +
                        "• Server ünvanının və portunun düzgün olduğuna bax.\n" +
                        "• Bir az sonra yenidən sına."
                });

            await interaction.editReply({ embeds: [embed] });
        }
    }
});

client.on("error", error => {
    console.error("Discord bağlantı xətası:", error);
});

client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error("❌ Bot Discord-a daxil ola bilmədi:", error);
});
