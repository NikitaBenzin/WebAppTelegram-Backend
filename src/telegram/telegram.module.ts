import { NestjsGrammyModule } from '@grammyjs/nestjs'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { PrismaService } from 'src/prisma.service'
import { AiService } from 'src/services/ai.service'
import { SpeechService } from 'src/services/speech.service'
import { TelegramService } from './telegram.service'
import { TelegramUpdate } from './telegram.update'

@Module({
	imports: [
		ConfigModule,
		NestjsGrammyModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: () => ({
				token: '7555674786:AAHbbwICchzxy4Zf3erkJJiy1YCuLQXOSxA'
			})
		})
	],
	providers: [
		TelegramUpdate,
		TelegramService,
		SpeechService,
		AiService,
		PrismaService
	]
})
export class TelegramModule {}
