module.exports = {
	name: 'about',
	description: 'Displays bot information',
	execute(message, args, Discord, client ,version) {
        const aboutMessage = new Discord.MessageEmbed()
	        .setColor('#0099ff')
	        .setTitle('About Bot')
	        .setDescription('^play\n^stop\n^skip')
	        .setFooter(`build ${version} || this bot is based`);

		message.channel.send(aboutMessage);
	},
}