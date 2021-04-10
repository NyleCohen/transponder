// import Discord.js and fs
const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');

// Get our tokens from ./config.json
const { prefix, token, version } = require('./config.json');

// Get our commands in /commands/
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

client.commands = new Discord.Collection();

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);

    // set a new item in the Collection
    // with the key as the command name and the value as the exported module
    client.commands.set(command.name, command);
}

client.on('ready', () => {
    console.log("Transponder squawking!");

    client.user.setPresence({
        status: 'dnd',
        game: {
            name: 'type ^play {song}',
            type: "WATCHING"
        }
    });
});

client.on('message', message => {
    // argument handler
    let args = message.content.substring(prefix.length).split(" ");

    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const cmd = args.shift().toLowerCase();
    const command = client.commands.get(cmd) || client.commands.find(a => a.aliases && a.aliases.includes(cmd));

    // Executes a module and passes args
    try {
        command.execute(message, args, Discord, client, version, cmd);
    } catch (error) {
        //Prints unsuccesful execution to user
        console.error(error);
        message.reply(`There was an error trying to execute that command:\n \`\`\`\n ${error}\n\`\`\``);
    }
});

client.login(token);