const { Events } = require("discord.js");
const Event = require("../base/Event");

class Ready extends Event {
    constructor() {
        super({
            name: Events.Error,
            on: true,
        });
    }

    async exe(client, error) {
        if (error?.message === undefined) return;

        await client.catchError(error);
    }
}

module.exports = Ready;