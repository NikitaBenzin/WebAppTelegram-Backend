import { Command, On, Start, Update } from '@grammyjs/nestjs'
import { Injectable } from '@nestjs/common'
import { Context } from 'grammy'
import { TelegramService } from './telegram.service'

@Update()
@Injectable()
export class TelegramUpdate {
	constructor(private readonly telegramService: TelegramService) {}

	@Start()
	async onStart(ctx: Context): Promise<void> {
		return this.telegramService.proccessStart(ctx)
	}

	@Command('flower')
	async onFlower(ctx: Context): Promise<void> {
		return this.telegramService.showCurrentState(ctx)
	}

	@Command('stats')
	async onStats(ctx: Context): Promise<void> {
		return this.telegramService.showFlowerStats(ctx)
	}

	@Command('reset')
	async onReset(ctx: Context): Promise<void> {
		return this.telegramService.resetFlower(ctx)
	}

	@Command('about')
	async onAbout(ctx: Context): Promise<void> {
		return this.telegramService.about(ctx)
	}

	@On('message')
	async onMessage(ctx: Context): Promise<void> {
		return this.telegramService.proccessMessage(ctx)
	}
}
