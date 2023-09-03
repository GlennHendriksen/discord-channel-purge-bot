const Discord = require('discord.js');
const fs = require('fs');


const client = new Discord.Client({ intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages
] });


const configFile = 'config.json';
const rawData = fs.readFileSync(configFile);
const config = JSON.parse(rawData);


const BOT_TOKEN = config.BOT_TOKEN;
const MOVETO_CATEGORY_ID = config.MOVETO_CATEGORY_ID;
const INACTIVITY_PERIOD_DAYS = config.INACTIVITY_PERIOD_DAYS;

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    
    checkChannelActivity();
    setInterval(checkChannelActivity, 24 * 60 * 60 * 1000); // Check every 24 hours
});


const CATEGORY_EXCEPTIONS = [
    "Raiding"
];

async function checkChannelActivity() {
    const guild = client.guilds.cache.first();
    if (!guild) return;

    const category = guild.channels.cache.get(MOVETO_CATEGORY_ID);
    if (!category || category.type !== Discord.ChannelType.GuildCategory) {
        console.error(`Category with ID ${MOVETO_CATEGORY_ID} not found.`);
        return;
    }

    guild.channels.cache.forEach(async (channel) => {
        if (channel.type === Discord.ChannelType.GuildText) {

            // If the category of the found channel is in the exceptions array, skip it, we don't want to purge channels that aren't suppose to be purged. 
            if(CATEGORY_EXCEPTIONS.includes(channel.parent.name)) {
                return;
            }

            const messages = await channel.messages.fetch({ limit: 1 });
            if (messages.size === 0) {
                const now = new Date();
                const channelCreatedAt = new Date(channel.createdTimestamp);
                const daysSinceCreation = Math.floor((now - channelCreatedAt) / (24 * 60 * 60 * 1000));

                if (daysSinceCreation >= INACTIVITY_PERIOD_DAYS) {
                    console.log(`Moving ${channel.name} to ${category.name} due to inactivity.`);
                    await channel.setParent(category);
                }
            }
        }
    });
}

client.login(BOT_TOKEN);