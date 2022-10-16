const { Client, EmbedBuilder, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
});
// const { createCommand} = require('./slash.js');

const prefix = '!problem';
const leetstat_prefix = '!leetstat';
const problemUrlBase = 'https://leetcode.com/problems/';
const ltApiUrl = 'https://leetcode.com/api/problems/all/';
const allProblems = [];
const freeProblems = [];
const paidProblems = [];
let totalProblems;
const allowedChannelIDs = process.env.ALLOWED_CHANNEL_IDS.split(',');

/**
 * Returns a random number based on provided max constraint.
 * @param {int} max
 */
function getRandomInt(max) {
	return Math.floor(Math.random() * Math.floor(max));
}

/**
 * Problem class to help parse the revelant properties of a problem from the Leetcode API
 * @param {*} problemObject
 */
function Problem(problemObject) {
	this.id = problemObject.stat.question_id;
	this.title = problemObject.stat.question__title;
	this.titleSlug = problemObject.stat.question__title_slug;
	this.difficulty =
    problemObject.difficulty.level === 3 ? 'Hard' : problemObject.difficulty.level === 2 ? 'Medium' : 'Easy';
	this.paidOnly = problemObject.paid_only;
	this.description = `Problem ID: ${this.id}\nTitle: ${this.title}\nSlug Title: ${this.titleSlug}\nDifficulty: ${this.difficulty}\nIs Paid? ${this.paidOnly}`;
}

/**
 * REST call to populate our arrays with data.
 */
axios
	.get(ltApiUrl)
	.then((resp) => {
		totalProblems = resp.data.num_total;
		resp.data.stat_status_pairs.forEach((problem) => {
			const newProblem = new Problem(problem);
 			// ToDo need to fix .filter but this works in the mean time
			if (newProblem.paidOnly === false) {
				freeProblems.push(newProblem);
			}
			else {
				paidProblems.push(newProblem);
			}
			allProblems.push(newProblem);
		});
	})
	.catch((err) => {
		console.log(err);
	});

// Bot code

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
    console.log(`Invite the bot using https://discord.com/api/oauth2/authorize?permissions=137439300672&scope=bot&client_id=${process.env.DISCORD_APP_ID}`);
	//	createCommand(client);
});

/**
 * Takes in the relevant array for the operation based on command and the message received by the bot.
 * Builds the MessageEmbed object with relevant info to be sent out to the particular channel/user.
 * @param {*} data
 * @param {*} msg
 * @param {string} diff
 */
function problemType(data, msg, diff = '') {
	if (diff != '') {
		const filteredByDiff = data.filter(
			(problem) => problem.difficulty.toLowerCase() === diff,
		);
		data = filteredByDiff;
	}
	const dataLen = data.length;
	const randProblem = getRandomInt(dataLen);
	const aProblem = data[randProblem];
	const problemUrl = problemUrlBase + aProblem.titleSlug + '/';

	const embed = new EmbedBuilder()
		.setTitle(aProblem.title)
		.setColor('#f89f1b')
		// online image from leetcode website for thumbnail (pls don't go down)
		.setThumbnail('https://leetcode.com/static/images/LeetCode_logo_rvs.png')
		// ToDo Scrape problem descriptions, add to object and embed (haHA might not do this)
		.setDescription(`${aProblem.difficulty} ${
			aProblem.paidOnly ? 'locked/paid' : 'unlocked/free'
		} problem.`)
		.setURL(problemUrl);
	msg.reply({ embeds: [embed] });
}

function stats(msg) {
	const args = msg.content.slice(leetstat_prefix.length).trim().split(' ');
	const username = args.shift().toLowerCase();
	if (!username) return;

	axios.get(`https://leetcode-stats-api.herokuapp.com/${username}`).then(function(resp) {
                const apiRes = resp.data;
		if (!apiRes) return;

        const embed = {
                "content": "",
                "tts": false,
                "embeds": [
                  {
                        "type": "rich",
                        "title": `Leetcode Stats`,
                        "description": `Stats for leetcode user ${username}`,
                        "color": 0xf89f1b,
                        "fields": [
                          {
                                "name": `Total Questions (Solved/Attempted)`,
                                "value": `${apiRes.totalSolved}/${apiRes.totalQuestions}`
                          },
                          {
                                "name": `Easy (Solved/Attempted)`,
                                "value": `${apiRes.easySolved}/${apiRes.totalEasy}`,
                                "inline": true
                          },
                          {
                                "name": `Medium (Solved/Attempted)`,
                                "value": `${apiRes.mediumSolved}/${apiRes.totalMedium}`,
                                "inline": true
                          },
                          {
                                "name": `Hard (Solved/Attempted)`,
                                "value": `${apiRes.hardSolved}/${apiRes.totalHard}`,
                                "inline": true
                          },
                          {
                                "name": `Acceptance Rate`,
                                "value": `${apiRes.acceptanceRate}%`
                          },
                          {
                                "name": `Ranking`,
                                "value": `${apiRes.ranking}`,
                                "inline": true
                          }
                        ],
                        "url": `https://leetcode.com/${username}/`
                  }
                ]
          }
        msg.reply(embed);

        }).catch((err) => {
                console.log(err);
        });
}

client.on('messageCreate', (msg) => {
	if (!allowedChannelIDs.includes(msg.channelId)) return;
	if (msg.author.bot) return;

	if (msg.content.includes(leetstat_prefix)) {
		msg.channel.sendTyping();
		stats(msg);
		return;
	}
	if (!msg.content.startsWith(prefix)) return;

	const args = msg.content.slice(prefix.length).trim().split(' ');
	const command = args.shift().toLowerCase();
	let diff;

	if (typeof args[0] != 'undefined') {
		const temp = args[0].toLowerCase();
		if (['easy', 'medium', 'hard'].indexOf(temp) >= 0) {
			diff = temp;
		}
	}

	msg.channel.sendTyping();

	if (command === 'info') {
		msg.reply(
			`Leetcode currently has a total of ${totalProblems} problems of which ${freeProblems.length} are free, and ${paidProblems.length} are paid.`,
		);
	}
	else if (command === 'free') {
		problemType(freeProblems, msg, diff);
	}
	else if (command === 'paid') {
		problemType(paidProblems, msg, diff);
	}
	else if (command === 'help') {
		msg.reply(
			'```Usage:\n\n\t!problem (without args) - gives you a random problem of any difficulty either paid/free.' +
			'\n\n\t!problem free - gives you a random freely accessible problem of any difficulty.' +
			'\n\n\t!problem paid - gives you a random paid/locked problem of any difficulty.' +
			`\n\n\t${leetstat_prefix} [username] - get the stats about your leetcode account` +
			'\n\nAdding difficulty modifiers:\n\n\t!problem <free | paid> <easy | medium | hard> - lets you pick a random free or paid problem of the chosen difficulty.```',
		);
	}
	else if (!command || command === '') {
                problemType(allProblems, msg, diff);
	}
	else {
		msg.channel.send("Do I look like a BIT major? Try again.");
	}
});

client.login(process.env.DISCORD_BOT_TOKEN);
