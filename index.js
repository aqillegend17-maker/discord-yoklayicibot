require('dotenv').config();
const {
  Client, GatewayIntentBits, REST, Routes,
  SlashCommandBuilder, EmbedBuilder
} = require('discord.js');
const { status } = require('minecraft-server-util');

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const HOST = process.env.MC_HOST || 'TalkLandBoxPVP.aternos.me';
const PORT = Number(process.env.MC_PORT || 40781);

if (!TOKEN || !CLIENT_ID) {
  console.error('Missing DISCORD_TOKEN or CLIENT_ID. Copy .env.example to .env and fill them in.');
  process.exit(1);
}

const commands = [
  new SlashCommandBuilder()
    .setName('testserver')
    .setDescription('TalkLand Minecraft server status test'),
  new SlashCommandBuilder()
    .setName('analiz')
    .setDescription('Analyze a Minecraft/Skript log text file for common errors')
    .addAttachmentOption(option => option
      .setName('fayl')
      .setDescription('Upload latest.log, console log, or Skript error text')
      .setRequired(true))
].map(c => c.toJSON());

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  const route = GUILD_ID
    ? Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
    : Routes.applicationCommands(CLIENT_ID);
  await rest.put(route, { body: commands });
  console.log(`Slash commands registered (${GUILD_ID ? 'guild' : 'global'}).`);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  client.user.setActivity('TalkLand BoxPVP tests');
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'testserver') {
    await interaction.deferReply();
    const started = Date.now();
    try {
      const result = await status(HOST, PORT, { timeout: 7000, enableSRV: false });
      const elapsed = Date.now() - started;
      const playersOnline = result.players?.online ?? 'Naməlum';
      const playersMax = result.players?.max ?? 'Naməlum';
      const version = result.version?.name || 'Naməlum';
      const sample = (result.players?.sample || []).map(p => p.name).slice(0, 10);
      const embed = new EmbedBuilder()
        .setTitle('⚔️ TalkLand AI Tester — Server testi')
        .setColor(0x2ecc71)
        .addFields(
          { name: 'Bağlantı', value: '🟢 Server cavab verdi', inline: true },
          { name: 'Versiya', value: String(version).slice(0, 100), inline: true },
          { name: 'Oyunçular', value: `${playersOnline}/${playersMax}`, inline: true },
          { name: 'Cavab müddəti', value: `${elapsed} ms`, inline: true },
          { name: 'Server ünvanı', value: `\`${HOST}:${PORT}\``, inline: false },
          { name: 'Vacib qeyd', value: 'Bu test yalnız server statusunu yoxlayır. Pluginlərin və komandaların işlədiyini təsdiqləmir.', inline: false }
        )
        .setTimestamp();
      if (sample.length) embed.addFields({ name: 'Görünən oyunçular', value: sample.join(', ').slice(0, 1000) });
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      const embed = new EmbedBuilder()
        .setTitle('⚔️ TalkLand AI Tester — Serverə cavab gəlmədi')
        .setColor(0xe74c3c)
        .setDescription('Server bağlı ola bilər, Aternos serveri hələ başlamamış ola bilər, yaxud ünvan/port əlçatan deyil.')
        .addFields(
          { name: 'Yoxlanılan ünvan', value: `\`${HOST}:${PORT}\`` },
          { name: 'Növbəti addım', value: 'Aternos panelində serverin **Online** olduğunu yoxla və bir neçə dəqiqə sonra yenidən sına.' }
        )
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    }
  }

  if (interaction.commandName === 'analiz') {
    await interaction.deferReply();
    const file = interaction.options.getAttachment('fayl', true);
    const allowed = /\.(log|txt)$/i.test(file.name);
    if (!allowed) return interaction.editReply('Zəhmət olmasa `.log` və ya `.txt` faylı yüklə.');
    if (file.size > 1_000_000) return interaction.editReply('Fayl 1 MB-dan kiçik olmalıdır. Böyük logdan yalnız son hissəni göndər.');
    try {
      const response = await fetch(file.url);
      if (!response.ok) throw new Error('Could not download attachment');
      const content = (await response.text()).slice(-250_000);
      const lines = content.split(/\r?\n/);
      const rules = [
        { label: 'Skript xətası', regex: /\[Skript\].*(error|can't|cannot|unknown type|line \d+)/i },
        { label: 'Naməlum tip/sintaksis', regex: /unknown type|can't understand this|can't parse|invalid line/i },
        { label: 'Plugin yüklənmə xətası', regex: /could not load plugin|error occurred while enabling|failed to load/i },
        { label: 'Asılılıq çatışmır', regex: /dependenc(y|ies).*missing|could not find.*class|no class def found/i },
        { label: 'Yaddaş problemi', regex: /outofmemoryerror|cannot allocate memory/i },
        { label: 'Server gecikməsi', regex: /can't keep up|server overloaded/i },
        { label: 'İcazə problemi', regex: /no permission|permission denied|you do not have permission/i }
      ];
      const found = [];
      for (const rule of rules) {
        const idx = lines.findIndex(line => rule.regex.test(line));
        if (idx >= 0) found.push({ label: rule.label, line: lines[idx].trim().slice(0, 300) });
      }
      const embed = new EmbedBuilder()
        .setTitle('🧠 TalkLand — Log analizi')
        .setColor(found.length ? 0xf1c40f : 0x2ecc71)
        .setDescription(found.length
          ? `Ümumi yoxlamada ${found.length} mümkün problem tapıldı. Bu avtomatik ilkin yoxlamadır; səhv nəticə də ola bilər.`
          : 'Yoxlanılan ümumi xəta nümunələri tapılmadı. Bu, logda heç bir problem olmadığına zəmanət vermir.')
        .setTimestamp();
      for (const item of found.slice(0, 7)) embed.addFields({ name: `⚠️ ${item.label}`, value: `\`\`\`${item.line}\`\`\``.slice(0, 1000) });
      embed.addFields({ name: 'Növbəti addım', value: 'Skript xətası varsa, xəta mesajının bir neçə sətrini və uyğun `.sk` faylını yoxla. Bot faylları dəyişmir və heç nə silmir.' });
      await interaction.editReply({ embeds: [embed] });
    } catch {
      await interaction.editReply('Faylı oxuya bilmədim. `.log` və ya `.txt` faylı olduğuna və açıq yükləmə linkinə malik olduğuna əmin ol.');
    }
  }
});

(async () => {
  try {
    await registerCommands();
    await client.login(TOKEN);
  } catch (error) {
    console.error('Startup failed:', error.message);
    process.exit(1);
  }
})();
