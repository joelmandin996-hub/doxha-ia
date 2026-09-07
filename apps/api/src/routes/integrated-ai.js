import { Router } from 'express';
import { ContentBlockType, stream, uploadImagesToPocketBase } from '../api/integrated-ai.js';
import { SystemPrompt, FinancialAssistantPrompt } from '../constants/prompts.js';
import { uploadFiles } from '../middleware/file-upload.js';
import { integratedAiRateLimit } from '../middleware/integrated-ai-rate-limit.js';
import { pocketbaseAuth } from '../middleware/pocketbase-auth.js';
import logger from '../utils/logger.js';

const router = Router();

router.use(pocketbaseAuth);

/**
 * Detects and extracts financial context from message.
 * Format: "CONTEXTE FINANCIER: {financial_data}\n\nQuestion: {user_question}"
 * @param {string} messageText
 * @returns {{ hasContext: boolean, context: string, question: string }}
 */
function extractFinancialContext(messageText) {
	const contextPrefix = 'CONTEXTE FINANCIER:';
	
	if (!messageText.includes(contextPrefix)) {
		return { hasContext: false, context: '', question: messageText };
	}

	// Split by the context prefix
	const parts = messageText.split(contextPrefix);
	if (parts.length < 2) {
		return { hasContext: false, context: '', question: messageText };
	}

	// Extract context and remaining text
	const contextAndQuestion = parts[1].trim();
	
	// Try to split by "Question:" or similar markers
	const questionMatch = contextAndQuestion.match(/(?:Question|Question\s*:|Demande|Demande\s*:)\s*(.+)/is);
	
	let context = contextAndQuestion;
	let question = '';
	
	if (questionMatch) {
		// Extract context (everything before the question marker)
		context = contextAndQuestion.substring(0, questionMatch.index).trim();
		question = questionMatch[1].trim();
	} else {
		// If no explicit question marker, try to split by double newline
		const doubleSplit = contextAndQuestion.split(/\n\n+/);
		if (doubleSplit.length > 1) {
			context = doubleSplit[0].trim();
			question = doubleSplit.slice(1).join('\n\n').trim();
		} else {
			// No clear separation, treat entire thing as context
			context = contextAndQuestion;
			question = '';
		}
	}

	return {
		hasContext: true,
		context,
		question: question || 'Analyze the provided financial context',
	};
}

router.post('/stream', integratedAiRateLimit, uploadFiles({
	allowedMimeTypes: [
		'image/jpeg',
		'image/png',
		'image/webp',
	],
	fieldName: 'images',
}), async (req, res) => {
	const { message } = req.body;

	if (!message) {
		throw new Error('message is required');
	}

	const parsedMessage = JSON.parse(message);

	// Extract text content from message for financial context detection
	const messageText = parsedMessage
		.filter(block => block.type === 'text')
		.map(block => block.text)
		.join('\n');

	// Detect and extract financial context
	const { hasContext, context, question } = extractFinancialContext(messageText);

	let systemPrompt = SystemPrompt;
	let finalMessage = parsedMessage;

	if (hasContext) {
		logger.info('Financial context detected in message');
		
		// Use financial assistant prompt
		systemPrompt = FinancialAssistantPrompt;
		
		// Rebuild message with context injected into system prompt
		// Replace text blocks with the extracted question
		finalMessage = parsedMessage.map(block => {
			if (block.type === 'text') {
				return { type: 'text', text: question };
			}
			return block;
		});
		
		// Inject financial context into the system prompt
		systemPrompt = `${FinancialAssistantPrompt}\n\n## Real-time Financial Context:\n${context}`;
	}

	if (req.files?.length > 0) {
		const imageUrls = await uploadImagesToPocketBase({ images: req.files });
		imageUrls.forEach((url) => {
			finalMessage.push({ type: ContentBlockType.Image, image: url });
		});
	}

	const sseStream = await stream({
		userId: req.pocketbaseUserId,
		systemPrompt,
		userMessage: finalMessage,
	});

	res.setHeader('Content-Type', 'text/event-stream');
	res.setHeader('Cache-Control', 'no-cache');
	res.setHeader('Connection', 'keep-alive');
	res.setHeader('X-Accel-Buffering', 'no');

	sseStream.pipe(res, { end: false });

	res.on('close', () => sseStream.destroy());
});

export default router;