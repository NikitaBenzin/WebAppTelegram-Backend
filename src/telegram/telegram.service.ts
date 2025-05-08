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
		const randomFlowerSelection = Math.floor(Math.random() * 3)
		const generatedFlower: string = FlowerType[randomFlowerSelection]

		const isExistFlower = await this.prismaService.flower.findUnique({
			where: {
				telegramId: String(ctx.msg?.chat.id)
			}
		})

		if (!isExistFlower) {
			await this.prismaService.flower.create({
				data: {
					name: generatedFlower,
					type: randomFlowerSelection,
					telegramId: String(ctx.msg?.chat.id),
					owners: [String(ctx.msg?.from?.id)]
				}
			})
		} else {
			await this.prismaService.flower.update({
				where: {
					id: isExistFlower.id
				},
				data: {
					name: generatedFlower,
					type: randomFlowerSelection
				}
			})
		}

		ctx.reply(`Type: ${generatedFlower}`)
	}

	async proccessMessage(ctx: Context) {
		const flower = await this.prismaService.flower.findUnique({
			where: {
				telegramId: String(ctx.msg?.chat.id)
			}
		})

		if (flower) {
			const newCurrentExp: number = Number(flower?.currentExp) + 1
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
						? Number(flower?.nextLvlExp) + 40 * flower.owners.length
						: Number(flower?.nextLvlExp),
					lvl: isNewLvl ? Number(flower?.lvl) + 1 : Number(flower?.lvl)
				}
			})

			if (isNewLvl) this.proccessNewLevel(ctx, newFlower.lvl)
		}
	}

	proccessNewLevel(ctx: Context, lvl: number) {
		switch (lvl) {
			case 1:
				ctx.reply(`Your flower reached first level 🥳\nHappy birthday! 💓`)
				break
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
		const posts = await this.prismaService.flower.findMany({
			where: {
				owners: {
					has: userId
				}
			}
		})
		return posts
	}

	async updateFlower(dto: FlowerDto): Promise<Flower> {
		return this.prismaService.flower.update({
			where: {
				id: dto.id
			},
			data: {
				name: dto.name
			}
		})
	}
}
