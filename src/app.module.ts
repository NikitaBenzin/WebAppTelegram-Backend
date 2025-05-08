import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { PrismaService } from './prisma.service'
import { TelegramModule } from './telegram/telegram.module'
import { TelegramService } from './telegram/telegram.service'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true
		}),
		TelegramModule
	],
	controllers: [AppController],
	providers: [TelegramService, PrismaService]
})
export class AppModule {}
