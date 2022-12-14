const {
    Collection,
    SlashCommandBuilder,
    SlashCommandUserOption,
    SlashCommandChannelOption,
    SlashCommandStringOption,
    ContextMenuCommandBuilder,
    ApplicationCommandType,
} = require("discord.js");
const fs = require("fs");

class CommandManager {
    constructor(client, dir = "./src/commands/") {
        this.client = client;
        this.dir = dir;

        // .............<string, Command>
        this.commands = new Collection();
    }

    loadFiles() {
        const commandFolders = fs.readdirSync(this.dir);
        commandFolders.forEach(folder => {
            const files = fs.readdirSync(`${this.dir}${folder}/`);

            for (const file of files) {
                const command = require(`../commands/${folder}/${file}`);
                if (new (command)().infos?.type !== undefined) {
                    this.commands.set(new (command)().infos.name, command);
                }
            }
        });

        const slashCommands = [];
        const contextCommands = [];

        this.commands.forEach(cmd => {
            cmd = new cmd();
            if (cmd.infos.type.includes(1)) {
                let description = cmd.infos.description;
                if (description.length > 100) description = description.slice(0, 97) + "...";
                let descriptionLocalizations = cmd.infos.descriptionLocalizations;
                for (const key in descriptionLocalizations) {
                    if (descriptionLocalizations[key].length > 100) {
                        descriptionLocalizations[key] = descriptionLocalizations[key].slice(0, 97) + "...";
                    }
                }

                const build = new SlashCommandBuilder()
                    .setName(cmd.infos.name)
                    .setDescription(description)
                    .setDescriptionLocalizations(descriptionLocalizations)
                    .setDMPermission(cmd.infos.dmPermission);

                for (const option of cmd.infos.options) {
                    if (option.type === 6) {
                        const userOption = new SlashCommandUserOption()
                            .setName(option.name)
                            .setDescription(option.description)
                            .setDescriptionLocalizations(option.descriptionLocalizations)
                            .setRequired(option.required);

                        if (option.nameLocalizations) userOption.setNameLocalizations(option.nameLocalizations);

                        build.addUserOption(userOption);
                    }
                    else if (option.type === 7) {
                        const stringOption = new SlashCommandChannelOption()
                            .setName(option.name)
                            .setDescription(option.description)
                            .setDescriptionLocalizations(option.descriptionLocalizations)
                            .setRequired(option.required);

                        if (option.nameLocalizations) stringOption.setNameLocalizations(option.nameLocalizations);

                        build.addChannelOption(stringOption);
                    }
                }

                slashCommands.push(build.toJSON());
            }
            if (cmd.infos.type.includes(2)) {
                const build = new ContextMenuCommandBuilder()
                    .setName(this.client.util.capitalize(cmd.infos.name))
                    .setType(ApplicationCommandType.User);

                contextCommands.push(build.toJSON());
            }
        });

        if (this.client.env.REGISTER_SLASH === "1") {
            void this.client.application.commands.set(slashCommands.concat(contextCommands));
            for (const guild of this.client.guilds.cache.values()) {
                void guild.commands.set([], guild.id);
            }
        }
    }

    getCommand(name) {
        if (this.commands.has(name)) { return this.commands.get(name); }
        else {
            return 0;
        }
    }

    async isOverloaded() {
        return this.client.requestsManager.totalSize >= this.client.maxRequests;
    }
}

module.exports = CommandManager;