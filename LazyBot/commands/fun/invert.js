const { Command } = require('discord.js-commando');
const Canvas = require('canvas-prebuilt');
const snekfetch = require('snekfetch');
const { promisifyAll } = require('tsubaki');
const fs = promisifyAll(require('fs'));
const path = require('path');

module.exports = class InvertCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'invert',
            group: 'fun',
            memberName: 'invert',
            description: 'Invert a user\'s avatar colors.',
            args: [
                {
                    key: 'user',
                    prompt: 'Which user would you like to invert?',
                    type: 'user'
                }
            ]
        });
    }

    async run(msg, args) {
        
        const { user } = args;
        const avatarURL = user.avatarURL;
        if (!avatarURL) return msg.say('This user has no avatar.');
        try {
            const Image = Canvas.Image;
            const canvas = new Canvas(256, 256);
            const ctx = canvas.getContext('2d');
            const avatar = new Image();
            const generate = () => {
                ctx.drawImage(avatar, 0, 0, 256, 256);
                const imgData = ctx.getImageData(0, 0, 256, 256);
                const data = imgData.data;
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = 255 - data[i];
                    data[i + 1] = 255 - data[i + 1];
                    data[i + 2] = 255 - data[i + 2];
                }
                ctx.putImageData(imgData, 0, 0);
            };
            const avatarImg = await snekfetch.get(avatarURL);
            avatar.src = avatarImg.body;
            generate();
            var buf = canvas.toBuffer()
            var toSend = fs.writeFileSync("invert.png", buf);
            return msg.say('', {file: 'invert.png'})
                .catch(err => msg.say(`${err.name}: ${err.message}`));
        } catch (err) {
            return msg.say(`${err.name}: ${err.message}`);
        }
    }
};
