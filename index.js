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

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const SERVER_HOST = "TalkLandBoxPVP.aternos.me";
const SERVER_PORT = 40781;

const STATUS_CHANNEL_ID = "1552369931247427686";
const CHECK_INTERVAL = 3 * 60 * 1000;

let lastStatus = null;
let checking = false;

const commands = [
    new SlashCommandBuilder()
        .setName("testserver")
        .setDescription("Minecraft serverini yoxla"),

    new SlashCommandBuilder()
        .setName("testerinfo")
        .setDescription("TalkLand AI Tester haqqında məlumat"),

    new SlashCommandBuilder()
        .setName("testplugins")
        .setDescription("Plugin test məlumatlarını göstər"),

    new SlashCommandBuilder()
        .setName("analiz")
        .setDescription("Serverin cari vəziyyətini analiz et"),

    new SlashCommandBuilder()
        .setName("hesabat")
        .setDescription("Server haqqında hesabat hazırla"),

    new SlashCommandBuilder()
        .setName("meslehet")
        .setDescription("Server üçün məsləhətlər göstər")
].map(command => command.toJSON());

async function checkServer() {
    if (checking) return;

    checking = true;

    try {
        const start = Date.now();

        const result = await mc.status(
            SERVER_HOST,
            SERVER_PORT,
            { timeout: 10000 }
        );

        const responseTime = Date.now() - start;

        const onlinePlayers = result.players.online;
        const maxPlayers = result.players.max;
        const version = result.version.name;

        console.log(
            `SERVER ONLINE | ${onlinePlayers}/${maxPlayers} | ${responseTime} ms`
        );

        // Server yenidən açılıbsa bildiriş göndər.
        if (lastStatus === false) {
            await sendStatusMessage(
                "🟢 Server yenidən ONLINE oldu!",
                `TalkLand BoxPVP yenidən cavab verir!\n` +
                `👥 Oyunçular: ${onlinePlayers}/${maxPlayers}\n` +
                `⚡ Cavab müddəti: ${responseTime} ms`
            );
        }

        lastStatus = true;

        return {
            online: true,
            players: onlinePlayers,
            maxPlayers,
            version,
            responseTime
        };

    } catch (error) {
        console.log("SERVER OFFLINE / CAVAB YOXDUR:", error.message);

        // Eyni problem üçün təkrar bildiriş göndərmə.
        if (lastStatus !== false) {
            await sendStatusMessage(
                "🔴 Serverə cavab alınmır!",
                "TalkLand BoxPVP serverinə sorğu uğursuz oldu.\n\n" +
                "• Aternos serverinin işlədiyini yoxla.\n" +
                "• Serverin tam başladığına əmin ol.\n" +
                "• Bir az sonra yenidən yoxla."
            );
        }

        lastStatus = false;

        return {
            online: false
        };

    } finally {
        checking = false;
    }
}

async function sendStatusMessage(title, description) {
    try {
        const channel = await client.channels.fetch(
            STATUS_CHANNEL_ID
        );

        if (!channel || !channel.isTextBased()) {
            console.log("Xəbərdarlıq kanalı tapılmadı!");
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(
                title.startsWith("🟢") ? 0x2ecc71 : 0xe74c3c
            )
            .setTitle(title)
            .setDescription(description)
            .setFooter({
                text: "TalkLand AI Tester PRO"
            })
            .setTimestamp();

        await channel.send({
            embeds: [embed],
            allowedMentions: { parse: [] }
        });

    } catch (error) {
        console.error(
            "Discord bildirişi göndərilmədi:",
            error.message
        );
    }
}

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

        console.log("✅ Bütün slash komandalar qeydiyyatdan keçdi!");

    } catch (error) {
        console.error("Komanda qeydiyyatı xətası:", error);
    }

    console.log("🔍 Server monitorinqi başladı.");
    console.log("⏱️ Yoxlama intervalı: 3 dəqiqə");

    // İlk yoxlama dərhal başlasın.
    await checkServer();

    // Sonra hər 3 dəqiqədən bir yoxla.
    setInterval(() => {
        checkServer();
    }, CHECK_INTERVAL);
});

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.commandName;

    if (command === "testerinfo") {
        const embed = new EmbedBuilder()
            .setColor(0x3498db)
            .setTitle("⚔️ TalkLand AI Tester PRO")
            .setDescription(
                "TalkLand BoxPVP üçün server monitorinq botu!"
            )
            .addFields(
                {
                    name: "🎮 Server",
                    value: `${SERVER_HOST}:${SERVER_PORT}`
                },
                {
                    name: "⏱️ Monitorinq",
                    value: "Hər 3 dəqiqədən bir",
                    inline: true
                },
                {
                    name: "📢 Bildirişlər",
                    value: "Server vəziyyəti dəyişdikdə",
                    inline: true
                }
            )
            .setFooter({
                text: "TalkLand BoxPVP"
            });

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }

    if (command === "testplugins") {
        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xf1c40f)
                    .setTitle("🔌 Plugin test məlumatı")
                    .setDescription(
                        "Bot serverə sorğu göndərə bilir, lakin " +
                        "pluginlərin hamısının işlədiyini bu yolla " +
                        "müəyyən etmək mümkün deyil.\n\n" +
                        "📋 Plugin xətalarını yoxlamaq üçün " +
                        "Aternos Console və ya server loglarını " +
                        "təhlil etmək lazımdır."
                    )
            ],
            ephemeral: true
        });
    }

    if (
        command === "analiz" ||
        command === "hesabat" ||
        command === "testserver"
    ) {
        await interaction.deferReply();

        const result = await checkServer();

        if (!result || !result.online) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xe74c3c)
                        .setTitle("🔴 Serverə cavab alınmadı")
                        .setDescription(
                            "Server offline ola bilər və ya sorğu vaxtı bitib.\n" +
                            "Aternos panelindən serverin vəziyyətini yoxla."
                        )
                        .setTimestamp()
                ]
            });
        }

        const embed = new EmbedBuilder()
            .setColor(0x2ecc71)
            .setTitle(
                command === "hesabat"
                    ? "📊 TalkLand Server Hesabatı"
                    : command === "analiz"
                    ? "🔍 TalkLand Server Analizi"
                    : "⚔️ TalkLand Server Testi"
            )
            .addFields(
                {
                    name: "🟢 Server vəziyyəti",
                    value: "ONLINE",
                    inline: true
                },
                {
                    name: "🎮 Minecraft versiyası",
                    value: String(result.version),
                    inline: true
                },
                {
                    name: "👥 Oyunçular",
                    value: `${result.players}/${result.maxPlayers}`,
                    inline: true
                },
                {
                    name: "⚡ Cavab müddəti",
                    value: `${result.responseTime} ms`,
                    inline: true
                }
            )
            .setFooter({
                text: "TalkLand AI Tester PRO"
            })
            .setTimestamp();

        return interaction.editReply({
            embeds: [embed]
        });
    }

    if (command === "meslehet") {
        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0x9b59b6)
                    .setTitle("💡 TalkLand Server Məsləhətləri")
                    .setDescription(
                        "• Lazımsız pluginləri sil.\n" +
                        "• Plugin versiyalarının serverə uyğunluğunu yoxla.\n" +
                        "• Aternos Console-da qırmızı xəta mesajlarını araşdır.\n" +
                        "• Serverin cavab müddətini müxtəlif vaxtlarda müqayisə et.\n" +
                        "• Server loglarını mütəmadi yoxla."
                    )
            ],
            ephemeral: true
        });
    }
});

client.on("error", error => {
    console.error("Discord xətası:", error);
});

client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error("Bot Discord-a daxil ola bilmədi:", error);
});
