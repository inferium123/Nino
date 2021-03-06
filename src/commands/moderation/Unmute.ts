import { Punishment, PunishmentType } from '../../structures/managers/PunishmentManager';
import { injectable, inject } from 'inversify';
import { Constants, Member } from 'eris';
import { Module } from '../../util';
import { TYPES } from '../../types';
import findUser from '../../util/UserUtil';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import Bot from '../../structures/Bot';

@injectable()
export default class UnmuteCommand extends Command {
  constructor(@inject(TYPES.Bot) client: Bot) {
    super(client, {
      name: 'unmute',
      description: 'Unmutes a user from a guild',
      usage: '<user> <reason>',
      category: Module.Moderation,
      guildOnly: true,
      userPermissions: Constants.Permissions.manageRoles,
      botPermissions: Constants.Permissions.manageRoles | Constants.Permissions.manageChannels
    });
  }

  async run(ctx: Context) {
    if (!ctx.args.has(0)) return ctx.sendTranslate('global.noUser');

    const userID = ctx.args.get(0);
    const u = findUser(this.bot, userID);
    if (!u || u === undefined) return ctx.sendTranslate('global.unableToFind');

    const member = ctx.guild!.members.get(u.id);
    if (!member) return ctx.sendTranslate('commands.moderation.notInGuild', {
      user: `${u.username}#${u.discriminator}`
    });

    const reason = ctx.args.has(1) ? ctx.args.slice(1).join(' ') : undefined;
    await this.bot.timeouts.cancelTimeout(member.id, ctx.guild!, 'unmute');
    const punishment = new Punishment(PunishmentType.Unmute, {
      moderator: ctx.sender
    });
    
    try {
      await this.bot.punishments.punish(member!, punishment, reason);
      const prefix = member instanceof Member ? member.user.bot ? 'Bot' : 'User' : 'User';

      return ctx.sendTranslate('commands.moderation.unmute', { type: prefix });
    } catch (e) {
      return ctx.sendTranslate('commands.moderation.unable', {
        message: e.message,
        type: member instanceof Member ? member.user.bot ? 'Bot' : 'User' : 'User'
      });
    }
  }
}
