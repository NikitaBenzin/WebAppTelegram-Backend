import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)

	app.setGlobalPrefix('api', {})

	app.enableCors({
		origin: ['https://flower-rise.uk', '185.70.196.187:443'],
		credentials: true,
		exposedHeaders: 'set-cookie'
	})

	await app.listen(8880, '0.0.0.0')
}
bootstrap()
