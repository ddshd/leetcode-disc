module.exports.createCommand = (client) => {
    const guildId = '425006557030252544' // Use your own guild ID
    const guild = client.guilds.cache.get(guildId)
    let commands

    if (guild) {
        commands = guild.commands
    } else {
        commands = client.application?.commands
    }

    commands?.create({
        "name": "problem",
        "description": "Get a leetcode problem",
        "options": [
            {
                "type": 3,
                "name": "plan",
                "description": "Type of leetcode plan",
                "choices": [
                    {
                        "name": "free",
                        "value": "free"
                    },
                    {
                        "name": "paid",
                        "value": "paid"
                    },
                    {
                        "name": "any",
                        "value": "any"
                    }
                ],
                "required": true
            },
            {
                "type": 3,
                "name": "difficulty",
                "description": "The difficulty of the problem",
                "choices": [
                    {
                        "name": "easy",
                        "value": "Get a random easy problem"
                    },
                    {
                        "name": "medium",
                        "value": "Get a random medium problem"
                    },
                    {
                        "name": "hard",
                        "value": "Get a random hard problem"
                    }
                ]
            }
        ]
    });
}
