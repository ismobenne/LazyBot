const { Command } = require('discord.js-commando');
const Canvas = require('canvas-prebuilt');
const snekfetch = require('snekfetch');
const { promisifyAll } = require('tsubaki');
const fs = promisifyAll(require('fs'));
const path = require('path');

module.exports = class RIPCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'rip',
         
            group: 'fun',
            memberName: 'rip',
            description: 'Puts a user\'s avatar over a gravestone.',
            args: [
                {
                    key: 'user',
                    prompt: 'Which user would you like to edit?',
                    type: 'user'
                }
            ]
        });
    }

    async run(msg, args) {
       
        const { user } = args;
       const avatarURL = user.avatarURL;
        if (!avatarURL) return msg.say('This User has no Avatar.');
        try {
            const Image = Canvas.Image;
            const canvas = new Canvas(507, 338);
            const ctx = canvas.getContext('2d');
            const base = new Image();
            const avatar = new Image();
            const generate = () => {
                ctx.drawImage(base, 0, 0);
                ctx.drawImage(avatar, 158, 51, 200, 200);
                const imgData = ctx.getImageData(158, 51, 200, 200);
                const data = imgData.data;
                for (let i = 0; i < data.length; i += 4) {
                    const brightness = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
                    data[i] = brightness;
                    data[i + 1] = brightness;
                    data[i + 2] = brightness;
                }
                ctx.putImageData(imgData, 158, 51);
            };
            base.src = await fs.readFileAsync(path.join(__dirname, '..', '..', 'assets', 'images', 'rip.png'));
            const avatarImg = await snekfetch.get(avatarURL);
            avatar.src = avatarImg.body;
            generate();
            var buf = canvas.toBuffer()
            var toSend = fs.writeFileSync("rip.png", buf);
            return msg.say('',{file: 'rip.png'})
                .catch(err => msg.say(`${err.name}: ${err.message}`));
        } catch (err) {
            return msg.say(`${err.name}: ${err.message}`);
        }
    }
};
