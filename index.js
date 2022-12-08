/**
 * ### MELLO ONLINE RADIO ZOOMER 9000 ###
 * 
 * original code written by zaire
 * good code rewritten by mellodoot
 */

const { Client, GatewayIntentBits, } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
const icy = require('icy');

const { bot_token, source, voice_channels } = require('./config.json');
/**
 * {
 * 		bot_token: [BOT TOKEN],
 * 		source: {
 * 			name: { String }
 * 			url: { String }
 * 		},
 * 		voice_channels: [
 * 			[VOICE CHANNEL ID],
 * 			...	
 * 		]
 * }
 */

const player = createAudioPlayer();
const stream = createAudioResource(source.url);

client.on('ready', async () => {
	voice_channels.forEach(async voice_channel => {
		let connection = await connect_voice(voice_channel);
		play_stream(connection);
	});
	init_metadata_reader(source.url);
});

/**
 * @param { String } voice_channel_id ID of the desired voice channel.
 * @returns { VoiceConnection } The resulting Discord voice channel upon connection.
 */
const connect_voice = (voice_channel_id) => new Promise(async (resolve) => {
	const voice_channel = await client.channels.fetch(voice_channel_id);

	const connection = joinVoiceChannel({
		channelId: voice_channel.id,
		guildId: voice_channel.guild.id,
		adapterCreator: voice_channel.guild.voiceAdapterCreator
	});

	connection.on(VoiceConnectionStatus.Disconnected, () => {
		player.stop();
	});

	resolve(connection);
});

/**
 * Subscribes the voice channel connection to the player feed, broadcasting audio from the source.
 * @param { VoiceConnection } connection 
 */
function play_stream(connection) {
	connection.subscribe(player);
	player.play(stream);
}

/**
 * Initialises the radio metadata tracking service, which updates the bot status accordingly.
 * @param {string} url A link to the radio source.
 */
function init_metadata_reader(url) {
	icy.get(url, function (i) {
		i.on('metadata', function (metadata) {
			let icyData = icy.parse(metadata);
			if (icyData.StreamTitle) set_activity(icyData.StreamTitle);
		});
		i.resume();
	});
}

/**
 * Sets the bot's current activity using the currently playing song name.
 * @param { String } song_name Expecting "Artist - Title" format
 */
function set_activity(song_name) {
	client.user.setPresence(
		{
			activities: [
				{ name: `${song_name} on ${source.name} 📻` }
			],
			status: 'online'
		}
	);
}

client.login(bot_token);
