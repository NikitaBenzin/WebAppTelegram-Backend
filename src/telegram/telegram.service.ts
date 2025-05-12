import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Flower } from '@prisma/client'

import { Context } from 'grammy'
import { FlowerDto } from 'src/dto/flower.dto'
import { PrismaService } from 'src/prisma.service'
import { FlowerType } from 'src/types/flower.type'

@Injectable()
export class TelegramService {
	private readonly botToken: string | undefined
	constructor(
		private readonly configService: ConfigService,
		private readonly prismaService: PrismaService
	) {
		this.botToken = configService.get<string>('TELEGRAM_BOT_TOKEN')
	}

	async proccessStart(ctx: Context) {
		if (ctx.chat?.type === 'private') {
			ctx.reply(
				`<b>🌱 Welcome to FlowerBot!</b>
	
	✨ <i>Grow a beautiful flower together with your friends right inside your Telegram group!</i>
	
	🌼 Your flower grows from <b>messages</b>, <b>stickers</b>, and <b>activity</b> in the group chat. The more you chat, the faster it blossoms! 🌸
	
	<b>How to get started:</b>
	1. 👥 <b>Add FlowerBot to a Telegram group</b>  
	2. 🚀 <b>Send the /start command in that group</b>  
	3. 💬 Watch your flower grow with every message!  
	
	🎯 Make it a fun community challenge — who will help it bloom the fastest?
	
	🪴 Ready to grow your first flower? Invite me to your group and let's begin!
	
	— <i>Your friendly garden companion 🌼</i>
	`,
				{
					reply_markup: {
						inline_keyboard: [
							[
								{
									text: 'Open app',
									web_app: { url: String(process.env.WEB_APP_URL) }
								}
							]
						]
					},
					parse_mode: 'HTML'
				}
			)
		} else {
			const isExistFlower = await this.prismaService.flower.findUnique({
				where: {
					telegramId: String(ctx.msg?.chat.id)
				}
			})

			if (!isExistFlower) {
				const randomFlowerSelection = Math.floor(Math.random() * 3)
				const generatedFlower: string = FlowerType[randomFlowerSelection]
				await this.prismaService.flower.create({
					data: {
						name: 'My Flower',
						type: randomFlowerSelection,
						telegramId: String(ctx.msg?.chat.id),
						owners: [String(ctx.msg?.from?.id)]
					}
				})

				ctx.reply(
					`<b>🌹 Let the Growing Begin!</b>
					
					🎉 FlowerBot has been successfully activated in this group!
					
					For this garden, a beautiful <b>${generatedFlower}</b> was randomly chosen to grow. 🌹  
					With your messages, reactions, and chat activity, this rose will bloom step by step!
					
					💬 <i>Every message helps your flower grow — so stay active and watch the magic happen!</i>
					
					🌟 You can check your progress at any time. Just keep chatting and enjoy the journey together!
					
					— <i>Happy growing, team 🌱</i>
					`,
					{
						reply_markup: {
							inline_keyboard: [
								[
									{
										text: 'Check my flower',
										url: 'https://t.me/flower_rise_bot'
									}
								]
							]
						},
						parse_mode: 'HTML'
					}
				)
			} else {
				ctx.reply(
					`<b>🌼 I'm already growing here!</b>\n
This chat already has a flower — let's keep helping it grow with every message! 🌱\n
Use <code>/flower</code> to check its progress or <code>/reset</code> to change the flower.`,
					{
						reply_markup: {
							inline_keyboard: [
								[
									{
										text: 'Check my flower',
										url: 'https://t.me/flower_rise_bot'
									}
								]
							]
						},
						parse_mode: 'HTML'
					}
				)
			}
		}
	}

	async proccessMessage(ctx: Context) {
		const flower = await this.prismaService.flower.findUnique({
			where: {
				telegramId: String(ctx.msg?.chat.id)
			}
		})

		if (flower) {
			const reward =
				ctx.msg?.voice !== undefined
					? ctx.msg?.voice.duration
					: ctx.msg?.video_chat_ended !== undefined
						? ctx.msg?.video_chat_ended?.duration
						: 1

			const newCurrentExp: number = Number(flower?.currentExp) + reward
			const isNewLvl: boolean =
				newCurrentExp > Number(flower?.nextLvlExp) ? true : false

			const isUserOwner: boolean = !!flower.owners.find(
				ownerId => ownerId === String(ctx.msg?.from?.id)
			)

			const newFlower = await this.prismaService.flower.update({
				where: {
					telegramId: String(ctx.msg?.chat.id)
				},
				data: {
					owners: isUserOwner
						? flower.owners
						: [String(ctx.msg?.from?.id), ...flower.owners],
					currentExp: isNewLvl
						? newCurrentExp - Number(flower?.nextLvlExp)
						: newCurrentExp,
					nextLvlExp: isNewLvl
						? Number(flower?.nextLvlExp) + 120 * flower.owners.length
						: Number(flower?.nextLvlExp),
					lvl: isNewLvl ? Number(flower?.lvl) + reward : Number(flower?.lvl)
				}
			})

			if (isNewLvl) this.proccessNewLevel(ctx, newFlower.lvl)
		}
	}

	proccessNewLevel(ctx: Context, lvl: number) {
		switch (lvl) {
			case 20:
				ctx.reply(`Your flower evolved 🥳\nKeep it up!`)
				break
			case 40:
				ctx.reply(`Your flower got new level 🥳\nFantastic!`)
				break
			case 65:
				ctx.reply(`Your flower got new level 🥳\nI’m very proud of you!`)
				break
			case 100:
				ctx.reply(`Your flower reached MAX level 🥳\nOur congratulations!`)
				break
			default:
				ctx.reply(`Your flower reached new level 🥳`)
		}
	}

	async getUserFlowers(userId: string): Promise<Flower[]> {
		const flowers = await this.prismaService.flower.findMany({
			where: {
				owners: {
					has: userId
				}
			}
		})
		return flowers
	}

	async updateFlowerName(dto: FlowerDto): Promise<Flower> {
		return this.prismaService.flower.update({
			where: {
				id: dto.data.id
			},
			data: {
				name: dto.data.name
			}
		})
	}

	async showCurrentState(ctx: Context) {
		ctx.reply(
			`🌸 Here's your flower! Watch it bloom as your group chats and stays active.`,
			{
				reply_markup: {
					inline_keyboard: [
						[
							{
								text: 'Check my flower',
								url: 'https://t.me/flower_rise_bot'
							}
						]
					]
				},
				parse_mode: 'HTML'
			}
		)
	}

	async showFlowerStats(ctx: Context) {
		const flower = await this.prismaService.flower.findUnique({
			where: {
				telegramId: String(ctx.msg?.chat.id)
			}
		})

		ctx.reply(
			`📊 Here's how your flower is growing! Every message helps it bloom faster.\n
<b>📊 Flower Growth Stats</b>
🌸 <b>Name:</b> ${flower?.name}
🏷️ <b>Type:</b> ${flower?.type}
🧬 <b>Level:</b> ${flower?.lvl}
✨ <b>Current EXP:</b> ${flower?.currentExp}
🎯 <b>Next Level At:</b> ${flower?.nextLvlExp}

💬 Keep chatting to help your flower grow!
The more active your group is, the faster it blossoms! 🌿`,
			{
				reply_markup: {
					inline_keyboard: [
						[
							{
								text: 'Check my flower',
								url: 'https://t.me/flower_rise_bot'
							}
						]
					]
				},
				parse_mode: 'HTML'
			}
		)
	}

	async resetFlower(ctx: Context) {
		const randomFlowerSelection = Math.floor(Math.random() * 3)
		const generatedFlower: string = FlowerType[randomFlowerSelection]
		await this.prismaService.flower.update({
			where: {
				telegramId: String(ctx.msg?.chat.id)
			},
			data: {
				type: randomFlowerSelection
			}
		})

		ctx.reply(
			`🔄 A new flower has been chosen! Let's see what you'll grow this time.\n
This time it's a <b>${generatedFlower}</b> 🌹`,
			{
				reply_markup: {
					inline_keyboard: [
						[
							{
								text: 'Check my flower',
								url: 'https://t.me/flower_rise_bot'
							}
						]
					]
				},
				parse_mode: 'HTML'
			}
		)
	}

	async about(ctx: Context) {
		ctx.reply(
			`<b>🌸 About This Bot</b>
This bot grows a flower in your group based on chat activity.
The more you talk — the more it blossoms! 🌿

🌼 This bot was created for a wonderful girl who “just wanted a flower.”
Now you can grow one too — together with your friends. 💬❤️`,
			{
				reply_markup: {
					inline_keyboard: [
						[
							{
								text: 'Check my flower',
								url: 'https://t.me/flower_rise_bot'
							}
						]
					]
				},
				parse_mode: 'HTML'
			}
		)
	}
}
