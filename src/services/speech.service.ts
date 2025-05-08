import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'
import * as FormData from 'form-data'
import { OPENAI_API, TELEGRAM_API } from 'src/constants'

@Injectable()
export class SpeechService {
	private readonly botToken: string | undefined
	private readonly openaiApiKey: string | undefined

	constructor(private readonly configService: ConfigService) {
		this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN')
		this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY')
	}

	async transcribeVoice(filePath: string): Promise<string> {
		const fileUrl = `${TELEGRAM_API}/file/bot${this.botToken}/${filePath}`
		const fileResponse = await axios.get(fileUrl, {
			// Передаем параметр responseType: 'stream', чтобы получить потоковый ответ, чтобы не загружать весь файл в память
			responseType: 'stream'
		})

		const formData = new FormData()
		formData.append('file', fileResponse.data, { filename: 'audio.ogg' })
		formData.append('model', 'whisper-1')

		const response = await axios.post<{ text: string }>(
			`${OPENAI_API}/audio/transcriptions`,
			formData,
			{
				headers: {
					Authorization: `Bearer ${this.openaiApiKey}`,
					...formData.getHeaders()
				}
			}
		)

		return response.data.text
	}
}
