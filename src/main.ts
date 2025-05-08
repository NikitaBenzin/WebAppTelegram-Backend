import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)

	app.setGlobalPrefix('api', {})

	app.enableCors({
		origin: [
			'http://localhost:3000',
			'https://70cb-78-88-196-154.ngrok-free.app'
		],
		credentials: true,
		exposedHeaders: 'set-cookie'
	})

	await app.listen(4200)
}
bootstrap()
