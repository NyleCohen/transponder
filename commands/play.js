const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const { ReactionCollector } = require('discord.js');

const queue = new Map();

module.exports = {
    name: 'play',
    async execute(message, args, Discord, client, version) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.channel.send('You need to be in a voice channel!');
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has('CONNECT')) return message.channel.send('You dont have the correct permissions for this command');

        const serverQueue = queue.get(message.guild.id);

        if (!args.length) return message.channel.send('No video!');
        let song = {};

        if (ytdl.validateURL(args[0])) {
            const songInfo = await ytdl.getInfo(args[0]);
            song = { title: songInfo.videoDetails.title, url: songInfo.videoDetails.video_url }
        } else {
            const videoFinder = async (query) => {
                const videoResult = await ytSearch(query);
                return (videoResult.videos.length > 1) ? videoResult.videos[0] : null;
            }

            const video = await videoFinder(args.join(' '));
            if (video) {
                song = { title: video.title, url: video.url }
            } else {
                message.channel.send('Couldnt find that video!');
            }
        }

        if (!serverQueue) {
            const queueConstructor = {
                voiceChannel: voiceChannel,
                textChannel: message.channel,
                connection: null,
                songs: []
            }

            queue.set(message.guild.id, queueConstructor);
            queueConstructor.songs.push(song);

            try {
                const connection = await voiceChannel.join();
                queueConstructor.connection = connection;
                videoPlayer(message.guild, queueConstructor.songs[0]);


            } catch {
                queue.delete(message.guild.id);
                message.channel.send('There was a critical error connecting!');
                throw err;
            }
        } else {
            serverQueue.songs.push(song);
            return message.channel.send(`**${song.title}** added to queue!`);
        }
    }
}

const videoPlayer = async (guild, song, message) => {
    const songQueue = queue.get(guild.id);

    const emojiToTrack = '⏯'

    const filter = (reaction, user) => {
        return ['⏯', '⏭', '🛑'].includes(reaction.emoji.name) && user.id === playMessage.author.id;
    };

    if (!song) {
        songQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }
    const stream = ytdl(song.url, { fliter: 'audioonly' });
    songQueue.connection.play(stream, { seek: 0, volume: 0.5 })
        .on('finish', () => {
            songQueue.songs.shift();
            videoPlayer(guild, songQueue.songs[0]);
        });
    const playMessage = await songQueue.textChannel.send(`Now playing **${song.title}**`);
    await playMessage.react('⏯');
    const collector = await playMessage.createReactionCollector(filter, { time: 15000 });

    collector.on('collect', (reaction, ReactionCollector) => {
        console.log(`Caught ${reaction.emoji.name}`)
    });
};


const skipSong = async (message, serverQueue) => {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.channel.send('You need to be in a voice channel!');
    if (!serverQueue) {
        return message.channel.send("No songs in the queue!");
    }
    serverQueue.connection.dispatcher.end();
}

const stopSong = (message, serverQueue) => {
    serverQueue.songs = [];
    serverQueue.connections.dispatcher.end();
}

