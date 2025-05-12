import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)

	app.setGlobalPrefix('api', {})

	app.enableCors({
		origin: [
			'http://localhost:3000',
			'https://web-app-telegram-iota.vercel.app/'
		],
		credentials: true,
		exposedHeaders: 'set-cookie'
	})

	await app.listen(3000)
}
bootstrap()
