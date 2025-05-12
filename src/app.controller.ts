import { Body, Controller, Get, Param, Put } from '@nestjs/common'
import { Flower } from '@prisma/client'
import { FlowerDto } from './dto/flower.dto'
import { TelegramService } from './telegram/telegram.service'

@Controller('/flower')
export class AppController {
	constructor(private readonly telegramService: TelegramService) {}

	@Get('/:userId')
	async getUserFlowers(@Param() params: any): Promise<Flower[]> {
		return await this.telegramService.getUserFlowers(String(params.userId))
	}

	@Put()
	async updateFlowerName(@Body() dto: FlowerDto): Promise<Flower> {
		return await this.telegramService.updateFlowerName(dto)
	}
}
