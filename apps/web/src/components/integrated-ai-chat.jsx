import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useAnimatedText } from '@/hooks/use-animated-text';
import { useIntegratedAi } from '@/hooks/use-integrated-ai';

const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE = 20 * 1024 * 1024;
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const getImageKey = file => `${file.name}:${file.size}:${file.lastModified}`;

const IntegratedAiChat = forwardRef(({ contextData = null }, ref) => {
	const [input, setInput] = useState('');
	const [selectedImages, setSelectedImages] = useState([]);
	const { messages, isStreaming, isLoadingHistory, sendMessage, clearMessages } = useIntegratedAi();
	const messagesEndRef = useRef(null);
	const fileInputRef = useRef(null);

	useImperativeHandle(ref, () => ({
		sendMessage: (msg) => sendMessage(msg, [], contextData)
	}), [sendMessage, contextData]);

	const imagePreviews = useMemo(() => selectedImages.map(file => ({
		key: getImageKey(file),
		file,
		url: URL.createObjectURL(file),
	})), [selectedImages]);

	useEffect(() => () => {
		imagePreviews.forEach(preview => URL.revokeObjectURL(preview.url));
	}, [imagePreviews]);

	const lastMessage = messages[messages.length - 1];
	const isLastMessageStreaming = isStreaming && lastMessage?.role === 'assistant';
	const animatedText = useAnimatedText(isLastMessageStreaming ? lastMessage.content : '');

	useEffect(() => {
		const scrollToBottom = () => {
			if (messagesEndRef.current) {
				messagesEndRef.current.scrollIntoView({
					behavior: 'smooth',
					block: 'end',
				});
			}
		};

		scrollToBottom();
	}, [messages]);

	const handleSubmit = useCallback((e) => {
		e.preventDefault();

		const trimmed = input.trim();

		if ((!trimmed && selectedImages.length === 0) || isStreaming) {
			return;
		}

		setInput('');
		sendMessage(trimmed, selectedImages, contextData);
		setSelectedImages([]);
	}, [input, selectedImages, isStreaming, sendMessage, contextData]);

	const handleImageSelect = useCallback((e) => {
		const files = Array.from(e.target.files || []);
		const validFiles = files.filter(file => VALID_IMAGE_TYPES.includes(file.type) && file.size <= MAX_IMAGE_SIZE);

		setSelectedImages((prev) => {
			const uniqueFilesMap = new Map(prev.map(file => [getImageKey(file), file]));
			validFiles.forEach(file => uniqueFilesMap.set(getImageKey(file), file));
			return Array.from(uniqueFilesMap.values()).slice(0, MAX_IMAGES);
		});

		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	}, [fileInputRef]);

	const removeImage = useCallback((index) => {
		setSelectedImages(prev => prev.filter((_, i) => i !== index));
	}, []);

	return (
		<div className="flex flex-col h-full w-full">
			<div className="flex items-center justify-between p-4 border-b bg-card">
				<h2 className="text-lg font-semibold flex items-center gap-2">
					<span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
					Discussion IA
				</h2>
			{messages.length > 0 && (
				<button
					onClick={clearMessages}
					disabled={isStreaming}
					className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
				>
					Effacer l'historique
				</button>
			)}
			</div>

			<div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth bg-muted/10">
				{isLoadingHistory && (
					<div className="text-center text-sm text-muted-foreground py-4">Chargement de l'historique...</div>
				)}
				{messages.length === 0 && !isLoadingHistory && (
					<div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto space-y-3 opacity-50">
						<div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
							🤖
						</div>
						<p className="text-lg font-medium">Prêt à vous aider !</p>
						<p className="text-sm">Posez-moi une question sur vos finances ou utilisez un des raccourcis ci-dessus.</p>
					</div>
				)}
				{messages.map((msg, i) => {
					const isLastStreamingMessage = isStreaming && i === messages.length - 1 && msg.role === 'assistant';
					const displayContent = isLastStreamingMessage ? animatedText : msg.content;

					return (
						<div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
							<div
								className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-sm ${
									msg.role === 'user'
										? 'bg-primary text-primary-foreground rounded-tr-sm'
										: 'bg-card border text-card-foreground rounded-tl-sm'
								}`}
							>
								<p className="whitespace-pre-wrap leading-relaxed">{displayContent}</p>
								{msg.images?.map((url, j) => (
									<img
										key={j}
										src={url}
										alt="AI generated"
										className="mt-3 rounded-lg max-w-full border"
									/>
								))}
								{msg.role === 'assistant' && isStreaming && i === messages.length - 1 && !msg.content && (
									<span className="inline-flex gap-1 items-center h-4 mt-2">
										<span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
										<span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
										<span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
									</span>
								)}
							</div>
						</div>
					);
				})}
				<div ref={messagesEndRef} />
			</div>

			<div className="p-4 border-t bg-card">
				{selectedImages.length > 0 && (
					<div className="mb-3 flex gap-2 flex-wrap">
						{imagePreviews.map(({ key, file, url }, index) => (
							<div key={key} className="relative group">
								<img
									src={url}
									alt={file.name}
									className="w-16 h-16 object-cover rounded-lg border shadow-sm"
								/>
								<button
									type="button"
									onClick={() => removeImage(index)}
									className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
								>
									×
								</button>
							</div>
						))}
					</div>
				)}
				<form onSubmit={handleSubmit} className="flex gap-2">
					<input
						ref={fileInputRef}
						type="file"
						accept={VALID_IMAGE_TYPES.join(',')}
						multiple
						onChange={handleImageSelect}
						className="hidden"
						disabled={isStreaming || isLoadingHistory}
					/>
					<button
						type="button"
						onClick={() => fileInputRef.current?.click()}
						className="rounded-full bg-muted w-10 h-10 flex items-center justify-center hover:bg-muted/80 disabled:opacity-50 transition-colors"
						disabled={isStreaming || isLoadingHistory || selectedImages.length >= MAX_IMAGES}
						title="Ajouter une image"
					>
						📎
					</button>
					<input
						type="text"
						value={input}
						onChange={e => setInput(e.target.value)}
						placeholder="Posez une question sur votre budget..."
						className="flex-1 rounded-full border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
						disabled={isStreaming || isLoadingHistory}
					/>
					<button
						type="submit"
						disabled={isStreaming || (!input.trim() && selectedImages.length === 0)}
						className="rounded-full bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
					>
						Envoyer
					</button>
				</form>
			</div>
		</div>
	);
});

IntegratedAiChat.displayName = 'IntegratedAiChat';
export default IntegratedAiChat;