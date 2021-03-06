import { injectable, inject } from 'inversify';
import { Constants } from 'eris';
import { Module } from '../../util';
import { TYPES } from '../../types';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import Bot from '../../structures/Bot';

@injectable()
export default class ReasonCommand extends Command {
  constructor(@inject(TYPES.Bot) client: Bot) {
    super(client, {
      name: 'reason',
      description: 'Updates a case\'s reason',
      usage: '<caseID> <reason>',
      aliases: ['update'],
      category: Module.Moderation,
      guildOnly: true,
      userPermissions: Constants.Permissions.banMembers,
      botPermissions: Constants.Permissions.manageMessages
    });
  }

  async run(ctx: Context) {
    if (!ctx.args.has(0)) return ctx.sendTranslate('commands.moderation.reason.noCase');
    if (!ctx.args.has(1)) return ctx.sendTranslate('commands.moderation.reason.noReason');

    const id = ctx.args.get(0);
    const reason = ctx.args.args.slice(1).join(' ');

    const _case = await this.bot.cases.get(ctx.guild!.id, parseInt(id));
    const settings = await this.bot.settings.get(ctx.guild!.id);

    if (!_case || _case === null) return ctx.sendTranslate('commands.moderation.reason.invalid', { id });
    _case.reason = reason;

    await this.bot.cases.update(ctx.guild!.id, parseInt(id), {
      $set: {
        'reason': reason
      }
    }, async (error) => {
      if (error) return ctx.sendTranslate('commands.moderation.reason.error', { id });

      const message = await this.bot.client.getMessage(settings!.modlog, _case.message);
      await this.bot.punishments.editModlog(_case, message);

      return ctx.sendTranslate('commands.moderation.reason.edited', {
        reason,
        id
      });
    });
  }
}
