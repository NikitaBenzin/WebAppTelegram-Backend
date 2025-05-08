import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'
import { OPENAI_API } from 'src/constants'
import {
	buildTimestampUserPrompt,
	TIMESTAMP_SYSTEM_PROMPT
} from 'src/prompts/timestamp.prompts'

interface IOpenAIResponse {
	choices: {
		message: {
			content: string
		}
	}[]
	usage: {
		prompt_tokens: number
		completion_tokens: number
	}
}

@Injectable()
export class AiService {
	private readonly openaiApiKey: string | undefined

	constructor(private readonly configService: ConfigService) {
		this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY')
	}

	async generateTimestamps(
		text: string,
		audioDurationSec: number
	): Promise<{
		timestamps: string
		cost: string
	}> {
		// Максимум логических сегментов
		const maxSegments = 10

		// Разбиваем текст на слова
		const words = text.split(/\s+/)

		const wordsPerSegment = Math.ceil(words.length / maxSegments)
		const secondsPerSegment = Math.floor(audioDurationSec / maxSegments)

		const segments: { time: string; content: string }[] = []

		for (let i = 0; i < maxSegments; i++) {
			// Вычисляем время начала сегмента
			const fromSec = i * secondsPerSegment
			// Преобразуем секунды в формат mm:ss
			const fromMin = String(Math.floor(fromSec / 60)).padStart(2, '0')
			const fromSecRest = String(fromSec % 60).padStart(2, '0')
			const time = `${fromMin}:${fromSecRest}`

			// Вычисляем индексы начала и конца сегмента
			const start = i * wordsPerSegment
			const end = start + wordsPerSegment
			const content = words.slice(start, end).join(' ')

			if (content.trim()) {
				// Добавляем сегмент в массив
				segments.push({ time, content })
			}
		}

		const preparedText = segments.map(({ content }) => content).join('\n')

		const systemMessage = TIMESTAMP_SYSTEM_PROMPT
		const userMessage = buildTimestampUserPrompt(preparedText)

		const response = await axios.post<IOpenAIResponse>(
			`${OPENAI_API}/chat/completions`,
			{
				model: 'gpt-4o-mini',
				messages: [
					{
						role: 'system',
						content: systemMessage
					},
					{
						role: 'user',
						content: userMessage
					}
				],
				temperature: 0.3, // Насколько "свободно" думает модель (0 — строго, 1 — креативно)
				max_tokens: 300 // Ограничиваем объём ответа
			},
			{
				headers: {
					Authorization: `Bearer ${this.openaiApiKey}`
				}
			}
		)

		const result = response.data.choices[0].message.content
		const usage = response.data.usage

		const inputCost = (usage.prompt_tokens / 1_000_000) * 0.15
		const outputCost = (usage.completion_tokens / 1_000_000) * 0.6
		const total = inputCost + outputCost

		const costText = `💸 Стоимость генерации: ~$${total.toFixed(4)}`

		return {
			timestamps: result,
			cost: costText
		}
	}
}
