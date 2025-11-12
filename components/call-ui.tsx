'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Phone, Mic, Volume2, VolumeX, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/lib/store/auth-store';

interface CallUIProps {
	friendId: string;
	friendName: string;
	onCallEnd?: () => void;
	autoStart?: boolean;
}

interface AudioClientRef {
	connect: () => Promise<void>;
	disconnect: () => void;
	toggleMute: () => void;
	clearAudioQueue: () => void;
	isConnected: boolean;
	isMuted: boolean;
	sentChunks: number;
	receivedChunks: number;
	incomingQueue: any[];
	ws: WebSocket | null;
}

const formatStatusLabel = (status: string | null): string => {
	if (!status) {
		return 'Connected';
	}

	const readable = status.replace(/[_-]+/g, ' ');
	return readable.charAt(0).toUpperCase() + readable.slice(1);
};

const getStatusVisualClasses = (status: string | null, isConnecting: boolean) => {
	if (isConnecting) {
		return {
			badge: 'bg-amber-500/10 text-amber-300',
			icon: 'bg-amber-500/15 text-amber-300'
		};
	}

	const normalized = (status || '').toLowerCase().replace(/[_\s]+/g, '-');

	if (!normalized) {
		return {
			badge: 'bg-emerald-500/10 text-emerald-300',
			icon: 'bg-emerald-500/15 text-emerald-300'
		};
	}

	if (['fail', 'failed', 'canceled', 'cancelled', 'busy', 'no-answer', 'noanswer'].includes(normalized)) {
		return {
			badge: 'bg-red-500/10 text-red-300',
			icon: 'bg-red-500/15 text-red-300'
		};
	}

	if (['completed', 'ended'].includes(normalized)) {
		return {
			badge: 'bg-emerald-500/10 text-emerald-300',
			icon: 'bg-emerald-500/15 text-emerald-300'
		};
	}

	return {
		badge: 'bg-sky-500/10 text-sky-300',
		icon: 'bg-sky-500/15 text-sky-300'
	};
};

export function CallUI({ friendId, friendName, onCallEnd, autoStart = false }: CallUIProps) {
	const [connecting, setConnecting] = useState(false);
	const [connected, setConnected] = useState(false);
	const [muted, setMuted] = useState(false);
	const [speakerMuted, setSpeakerMuted] = useState(false);
	const [callId, setCallId] = useState<string | null>(null);
	const [hangingUp, setHangingUp] = useState(false);
	const [callStatus, setCallStatus] = useState<string | null>(null);
	const [callBilling, setCallBilling] = useState<number | null>(null);

	const audioClientRef = useRef<AudioClientRef | null>(null);
	const audioContextRef = useRef<AudioContext | null>(null);
	const gainNodeRef = useRef<GainNode | null>(null);
	const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

	const { user } = useAuthStore();
	const authToken = user?.auth_token;
	// Auto-start call if enabled
	useEffect(() => {
		if (autoStart && !connecting && !connected) {
			handleMakeCall();
		}
	}, [autoStart]);

	// Clean up on unmount
	useEffect(() => {
		return () => {
			if (audioClientRef.current?.isConnected) {
				audioClientRef.current.disconnect();
			}

			if (audioContextRef.current) {
				audioContextRef.current.close();
			}

			if (pollingIntervalRef.current) {
				clearInterval(pollingIntervalRef.current);
			}
		};
	}, []);

	// Handle call end callback when disconnected
	const prevConnectedRef = useRef(connected);
	useEffect(() => {
		// Only trigger onCallEnd if we were previously connected and now disconnected
		if (prevConnectedRef.current && !connected && callId && onCallEnd) {
			onCallEnd();
		}
		prevConnectedRef.current = connected;
	}, [connected, callId, onCallEnd]);

	// Poll call status when call is active
	useEffect(() => {
		if (!callId || !authToken) {
			if (pollingIntervalRef.current) {
				clearInterval(pollingIntervalRef.current);
				pollingIntervalRef.current = null;
			}
			return;
		}

		const pollCallStatus = async () => {
			if (!authToken) {
				return;
			}
			try {
				const response = await fetch('https://db.subspace.money/v1/graphql', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${authToken}`
					},
					body: JSON.stringify({
						query: `
							query GetCallStatus($call_id: uuid!) {
								whatsub_user_calls(where: { call_id: { _eq: $call_id } }) {
									id
									call_id
									status
								}
							}
						`,
						variables: {
							call_id: callId
						}
					})
				});

				const result = await response.json();
				const calls = result?.data?.whatsub_user_calls || [];

				if (calls.length > 0) {
					const call = calls[0];
					const newStatus = call?.status;

					if (newStatus !== callStatus) {
						setCallStatus(newStatus);
						
						// Check for terminal call states
						const terminalStatuses = ['fail', 'failed', 'completed', 'ended', 'busy', 'no-answer', 'canceled', 'cancelled'];
						if (terminalStatuses.includes(newStatus?.toLowerCase() || '')) {
							if (audioClientRef.current && audioClientRef.current.isConnected) {
								audioClientRef.current.disconnect();
							}
							setConnected(false);
							setConnecting(false);
						}
					}
				}
			} catch (err) {
				console.error('Error polling call status:', err);
			}
		};

		pollCallStatus();
		pollingIntervalRef.current = setInterval(pollCallStatus, 5000);

		return () => {
			if (pollingIntervalRef.current) {
				clearInterval(pollingIntervalRef.current);
				pollingIntervalRef.current = null;
			}
		};
	}, [callId, authToken, callStatus, callBilling]);


	const updateStats = () => {
		// Stats tracking removed for cleaner UI
	};

	const handleMakeCall = async () => {
		if (!user?.id || !authToken) {
			toast.error('Please enter a phone number and select an API token');
			return;
		}

		try {
			setConnecting(true);
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${authToken}`
				},
				body: JSON.stringify({
					query: `
						mutation CreateDirectCall($user_id: uuid!, $friend_id: uuid!) {
							createDirectCall(request: {user_id: $user_id, friend_id: $friend_id}) {
								success
								message
								data
							}
						}
					`,
					variables: {
						user_id: user?.id,
						friend_id: friendId
					}
				})
			});

			const result = await response.json();
			const { createDirectCall } = result.data;


			if (!createDirectCall?.success) {
				throw new Error(createDirectCall?.message || 'Failed to create call');
			}

			const callData = createDirectCall.data;
			if (!callData?.websocket) {
				throw new Error('Failed to get WebSocket URL');
			}

			setCallId(callData.call_id);
			setCallStatus(callData?.status || 'queued'); // Set initial status

			initializeAudioClient(callData.websocket);

		} catch (err: any) {
			console.error('Error making call:', err);
			toast.error('Failed to make call');
			setConnecting(false);
			onCallEnd?.();
		}
	};

	const initializeAudioClient = async (wsUrl: string) => {
		try {
			const sampleRt = new URL(wsUrl).searchParams.get("sampleRate");
			const sampleRate = Number(sampleRt);

			const AudioClient: any = {
				ruptureUrl: 'https://rupture2.vocallabs.ai',
				ws: null,
				audioContext: null,
				mediaStream: null,
				sourceNode: null,
				processorNode: null,
				gainNode: null,

				isConnected: false,
				isMuted: false,
				sampleRate: sampleRate,
				chunkSize: (sampleRate === 8000 ? 320 : 640),

				MAX_QUEUE_SIZE: 15,
				outgoingBuffer: new Float32Array(0),
				incomingQueue: [],
				audioPumping: false,
				pumpTimer: null,
				nextScheduledTime: 0,

				filterNode: null,
				compressorNode: null,
				noiseGateThreshold: -50,
				noiseGateRatio: 10,
				smoothingFactor: 0.9,
				currentLevel: 0,

				sentChunks: 0,
				receivedChunks: 0,

				async connect() {
					try {
						await this.connectWebSocket(wsUrl);
						await this.initializeAudio();

						this.isConnected = true;
						setConnected(true);
						setConnecting(false);

					} catch (error: any) {
						this.disconnect();
						this.isConnected = false;
						setConnected(false);
						setConnecting(false);
					}
				},

				connectWebSocket(url: string) {
					return new Promise((resolve, reject) => {
						this.ws = new WebSocket(url);

						this.ws.onopen = () => {
							resolve(null);
						};

						this.ws.onmessage = (event: MessageEvent) => {
							this.handleWebSocketMessage(event);
						};

						this.ws.onclose = () => {
							if (this.isConnected) {
								this.isConnected = false;
								setConnected(false);
								this.disconnect();
							}
						};

						this.ws.onerror = () => {
							reject(new Error('WebSocket connection failed'));
						};

						setTimeout(() => {
							if (this.ws?.readyState !== WebSocket.OPEN) {
								reject(new Error('Connection timeout'));
							}
						}, 10000);
					});
				},

				async initializeAudio() {
					try {
						this.mediaStream = await navigator.mediaDevices.getUserMedia({
							audio: {
								sampleRate: this.sampleRate,
								channelCount: 1,
								echoCancellation: true,
								noiseSuppression: true,
								autoGainControl: true,
								suppressLocalAudioPlayback: true
							}
						});

						this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
							sampleRate: this.sampleRate
						});

						audioContextRef.current = this.audioContext;

						if (this.audioContext.state === 'suspended') {
							await this.audioContext.resume();
						}

						this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

						this.filterNode = this.audioContext.createBiquadFilter();
						this.filterNode.type = 'highpass';
						this.filterNode.frequency.setValueAtTime(80, this.audioContext.currentTime);
						this.filterNode.Q.setValueAtTime(0.7, this.audioContext.currentTime);

						this.compressorNode = this.audioContext.createDynamicsCompressor();
						this.compressorNode.threshold.setValueAtTime(-24, this.audioContext.currentTime);
						this.compressorNode.knee.setValueAtTime(30, this.audioContext.currentTime);
						this.compressorNode.ratio.setValueAtTime(12, this.audioContext.currentTime);
						this.compressorNode.attack.setValueAtTime(0.003, this.audioContext.currentTime);
						this.compressorNode.release.setValueAtTime(0.25, this.audioContext.currentTime);

						this.gainNode = this.audioContext.createGain();
						gainNodeRef.current = this.gainNode;

						this.processorNode = this.audioContext.createScriptProcessor(1024, 1, 1);

						this.sourceNode.connect(this.filterNode);
						this.filterNode.connect(this.compressorNode);
						this.compressorNode.connect(this.gainNode);
						this.gainNode.connect(this.processorNode);
						this.processorNode.connect(this.audioContext.destination);

						this.processorNode.onaudioprocess = this.handleAudioProcess.bind(this);

					} catch (error: any) {
						throw new Error(`Failed to initialize audio: ${error.message}`);
					}
				},

				handleAudioProcess(event: any) {
					if (!this.isMuted && this.isConnected) {
						const inputBuffer = event.inputBuffer;
						const processedBuffer = this.applyNoiseGate(inputBuffer);
						this.processAudioInput(processedBuffer);
					}
				},

				processAudioInput(inputBuffer: AudioBuffer) {
					const inputData = inputBuffer.getChannelData(0);

					const combined = new Float32Array(this.outgoingBuffer.length + inputData.length);
					combined.set(this.outgoingBuffer);
					combined.set(inputData, this.outgoingBuffer.length);
					this.outgoingBuffer = combined;

					const samplesPerChunk = this.chunkSize / 2;

					while (this.outgoingBuffer.length >= samplesPerChunk) {
						const chunk = this.outgoingBuffer.slice(0, samplesPerChunk);
						this.outgoingBuffer = this.outgoingBuffer.slice(samplesPerChunk);

						this.sendAudioChunk(chunk);
					}
				},

				sendAudioChunk(audioData: Float32Array) {
					if (!this.ws || this.ws?.readyState !== WebSocket.OPEN) return;

					const pcmData = new Int16Array(audioData.length);
					for (let i = 0; i < audioData.length; i++) {
						pcmData[i] = Math.max(-32768, Math.min(32767, audioData[i] * 32767));
					}

					const bytes = new Uint8Array(pcmData.buffer);
					const base64Data = btoa(String.fromCharCode(...bytes));

					const message = {
						event: 'media',
						media: {
							contentType: 'audio/x-l16',
							sampleRate: this.sampleRate,
							payload: base64Data
						}
					};

					try {
						this.ws.send(JSON.stringify(message));
						this.sentChunks++;
						updateStats();
					} catch (error: any) {
						console.error('Failed to send audio chunk:', error);
					}
				},

				handleWebSocketMessage(event: MessageEvent) {
					try {
						const message = JSON.parse(event.data);

						if (message.event === 'playAudio' && message.media && message.media.payload) {
							this.handleIncomingAudio(message.media.payload);
							this.receivedChunks++;
							updateStats();
						}

					} catch (error: any) {
						console.error(`Error parsing message: ${error.message}`);
					}
				},

				handleIncomingAudio(base64Data: string) {
					try {
						if (speakerMuted) return;

						const binaryString = atob(base64Data);
						const bytes = new Uint8Array(binaryString.length);
						for (let i = 0; i < binaryString.length; i++) {
							bytes[i] = binaryString.charCodeAt(i);
						}

						const pcmData = new Int16Array(bytes.buffer);
						const floatData = new Float32Array(pcmData.length);
						for (let i = 0; i < pcmData.length; i++) {
							floatData[i] = pcmData[i] / 32767;
						}

						if (this.incomingQueue.length >= this.MAX_QUEUE_SIZE) {
							this.incomingQueue.shift();
						}

						this.incomingQueue.push(floatData);
						updateStats();

						if (!this.audioPumping) {
							this.startAudioPump();
						}

					} catch (error: any) {
						console.error(`Error processing incoming audio: ${error.message}`);
					}
				},

				async startAudioPump() {
					if (this.audioPumping || !this.audioContext) return;

					this.audioPumping = true;
					this.nextScheduledTime = this.audioContext.currentTime + 0.1;

					const pump = () => {
						if (!this.isConnected || !this.audioContext) {
							this.audioPumping = false;
							if (this.pumpTimer) {
								clearTimeout(this.pumpTimer);
								this.pumpTimer = null;
							}
							return;
						}

						const minBuffer = 3;
						const maxBuffer = 15;

						if (this.incomingQueue.length >= minBuffer || this.incomingQueue.length > maxBuffer) {
							while (this.incomingQueue.length > 0 && this.incomingQueue.length >= minBuffer) {
								const audioData = this.incomingQueue.shift();
								if (!speakerMuted) {
									this.playAudioChunk(audioData);
								}
								updateStats();

								if (this.incomingQueue.length <= minBuffer) break;
							}
						}

						const samplesPerChunk = this.chunkSize / 2;
						const chunkDuration = samplesPerChunk / this.sampleRate;
						const intervalMs = chunkDuration * 1000;

						this.pumpTimer = setTimeout(pump, intervalMs);
					};

					pump();
				},

				applyNoiseGate(inputBuffer: AudioBuffer) {
					const inputData = inputBuffer.getChannelData(0);
					const outputData = new Float32Array(inputData.length);

					for (let i = 0; i < inputData.length; i++) {
						this.currentLevel = this.smoothingFactor * this.currentLevel +
							(1 - this.smoothingFactor) * Math.abs(inputData[i]);

						const levelDb = 20 * Math.log10(Math.max(this.currentLevel, 0.000001));

						let gateGain = 1.0;
						if (levelDb < this.noiseGateThreshold) {
							const reduction = Math.min(1.0, Math.max(0.0,
								(levelDb - this.noiseGateThreshold + 10) / 10));
							gateGain = Math.pow(reduction, this.noiseGateRatio);
						}

						outputData[i] = inputData[i] * gateGain;
					}

					const processedBuffer = this.audioContext.createBuffer(1, outputData.length, this.audioContext.sampleRate);
					processedBuffer.getChannelData(0).set(outputData);

					return processedBuffer;
				},

				playAudioChunk(audioData: Float32Array) {
					if (!this.audioContext) return;

					try {
						const buffer = this.audioContext.createBuffer(1, audioData.length, this.sampleRate);
						buffer.getChannelData(0).set(audioData);

						const source = this.audioContext.createBufferSource();
						source.buffer = buffer;
						source.connect(this.audioContext.destination);

						const now = this.audioContext.currentTime;

						if (this.nextScheduledTime <= now) {
							this.nextScheduledTime = now;
						}

						source.start(this.nextScheduledTime);

						const chunkDuration = audioData.length / this.sampleRate;
						this.nextScheduledTime += chunkDuration;

						const maxFutureTime = now + 1.0;
						if (this.nextScheduledTime > maxFutureTime) {
							this.nextScheduledTime = maxFutureTime;
						}

					} catch (error: any) {
						this.nextScheduledTime = this.audioContext.currentTime;
					}
				},

				toggleMute() {
					this.isMuted = !this.isMuted;
					setMuted(this.isMuted);
				},

				clearAudioQueue() {
					this.incomingQueue = [];
					this.outgoingBuffer = new Float32Array(0);

					if (this.audioContext) {
						this.nextScheduledTime = this.audioContext.currentTime;
					}

					updateStats();
				},

				disconnect() {
					this.isConnected = false;
					setConnected(false);

					if (this.ws) {
						this.ws.close();
						this.ws = null;
					}

					if (this.processorNode) {
						this.processorNode.disconnect();
						this.processorNode = null;
					}

					if (this.sourceNode) {
						this.sourceNode.disconnect();
						this.sourceNode = null;
					}

					if (this.gainNode) {
						this.gainNode.disconnect();
						this.gainNode = null;
					}

					if (this.filterNode) {
						this.filterNode.disconnect();
						this.filterNode = null;
					}

					if (this.compressorNode) {
						this.compressorNode.disconnect();
						this.compressorNode = null;
					}

					this.currentLevel = 0;

					if (this.audioContext) {
						this.audioContext.close();
						this.audioContext = null;
						audioContextRef.current = null;
					}

					if (this.mediaStream) {
						this.mediaStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
						this.mediaStream = null;
					}

					this.audioPumping = false;
					if (this.pumpTimer) {
						clearTimeout(this.pumpTimer);
						this.pumpTimer = null;
					}

					this.incomingQueue = [];
					this.outgoingBuffer = new Float32Array(0);
					this.isMuted = false;

					setMuted(false);
					updateStats();
				}
			};

			audioClientRef.current = AudioClient;
			await AudioClient.connect();

		} catch (err: any) {
			console.error('Error initializing audio client:', err);
			setConnecting(false);
		}
	};

	const handleToggleMute = () => {
		if (audioClientRef.current) {
			audioClientRef.current.toggleMute();
		}
	};

	const handleToggleSpeaker = () => {
		setSpeakerMuted(!speakerMuted);

		if (gainNodeRef.current) {
			gainNodeRef.current.gain.value = !speakerMuted ? 0 : 1;
		}

	};

	const handleDisconnect = async () => {
		if (!callId || !user?.id || !authToken) {
			if (audioClientRef.current) {
				audioClientRef.current.disconnect();
			}
			if (onCallEnd) {
				onCallEnd();
			}
			return;
		}

		try {
			setHangingUp(true);

			await fetch('/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${authToken}`
				},
				body: JSON.stringify({
					query: `
						mutation HangUpCall($call_id: uuid = "", $client_id: uuid = "") {
							vocallabsCallHangUp(request: {call_id: $call_id, client_id: $client_id}) {
								affected_rows
								call_id
							}
						}
					`,
					variables: {
						call_id: callId,
						client_id: user.id
					}
				})
			});

			toast.success('Call ended successfully');

			if (audioClientRef.current) {
				audioClientRef.current.disconnect();
			}

			setCallId(null);
			setConnected(false);
			setConnecting(false);
			setCallStatus(null);
			setCallBilling(null);

			if (onCallEnd) {
				onCallEnd();
			}

		} catch (err: any) {
			console.error('Error hanging up call:', err);
			toast.error('Failed to end call');

			if (audioClientRef.current) {
				audioClientRef.current.disconnect();
			}
		} finally {
			setHangingUp(false);
		}
	};

	if (!connected && !connecting) {
		return (
			<div className="flex justify-center">
				<button
					type="button"
					onClick={handleMakeCall}
					disabled={connecting}
					className={cn(
						"inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg",
						"text-white bg-green-500",
						"hover:bg-green-600",
						"transition-colors",
						"disabled:opacity-50 disabled:cursor-not-allowed"
					)}
				>
					<Phone className="w-4 h-4 mr-2" />
					Call
				</button>
			</div>
		);
	}

	const statusLabel = connecting ? 'Calling...' : formatStatusLabel(callStatus);
	const statusVisual = getStatusVisualClasses(callStatus, connecting);
	const statusDescription = connecting
		? 'Hang tight while we connect your call.'
		: `Status: ${statusLabel}. Use the controls below to manage your audio.`;
	const controlsDisabled = !connected || hangingUp;

	return (
		<div className="space-y-4">
			<div className="rounded-2xl border border-dark-300 bg-dark-400 p-4 sm:p-5 space-y-4 transition-colors">
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center gap-3 min-w-0 flex-1">
						<div
							className={cn(
								'flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full',
								statusVisual.icon
							)}
						>
							{connecting ? (
								<Loader2 className="h-5 w-5 animate-spin" />
							) : (
								<Phone className="h-5 w-5" />
							)}
						</div>
						<div className="min-w-0">
							<p className="text-sm sm:text-base font-semibold text-white truncate">{friendName}</p>
							<div className="mt-1 flex items-center gap-2 flex-wrap">
								<span
									className={cn(
										'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
										statusVisual.badge
									)}
								>
									{statusLabel}
								</span>
								{callBilling && connected && (
									<span className="text-xs text-gray-400">
										Cost: ${callBilling.toFixed(4)}
									</span>
								)}
							</div>
						</div>
					</div>
				</div>
				<p className="text-xs text-gray-400 min-h-[1.25rem]">{statusDescription}</p>
				<div className="grid grid-cols-2 gap-2 sm:gap-3">
					<button
						type="button"
						onClick={handleToggleMute}
						disabled={controlsDisabled}
						aria-pressed={muted}
						className={cn(
							'flex flex-col items-center justify-center gap-1 rounded-xl border px-3 py-3 sm:px-4 sm:py-4 text-xs sm:text-sm font-medium transition-all',
							controlsDisabled
								? 'border-dark-300 bg-dark-500 text-gray-500 cursor-not-allowed opacity-60'
								: muted
									? 'border-red-500/60 bg-red-500/10 text-red-300 hover:border-red-400/70'
									: 'border-dark-300 bg-dark-500 text-gray-100 hover:border-dark-100 hover:bg-dark-300'
						)}
					>
						<Mic className="h-5 w-5" />
						<span>{muted ? 'Mic Off' : 'Mic On'}</span>
					</button>
					<button
						type="button"
						onClick={handleToggleSpeaker}
						disabled={controlsDisabled}
						aria-pressed={speakerMuted}
						className={cn(
							'flex flex-col items-center justify-center gap-1 rounded-xl border px-3 py-3 sm:px-4 sm:py-4 text-xs sm:text-sm font-medium transition-all',
							controlsDisabled
								? 'border-dark-300 bg-dark-500 text-gray-500 cursor-not-allowed opacity-60'
								: speakerMuted
									? 'border-red-500/60 bg-red-500/10 text-red-300 hover:border-red-400/70'
									: 'border-dark-300 bg-dark-500 text-gray-100 hover:border-dark-100 hover:bg-dark-300'
						)}
					>
						{speakerMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
						<span>{speakerMuted ? 'Speaker Off' : 'Speaker On'}</span>
					</button>
				</div>
			</div>
			<button
				type="button"
				onClick={handleDisconnect}
				disabled={hangingUp}
				className={cn(
					'w-full py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg',
					'text-white bg-red-600',
					'hover:bg-red-700',
					'transition-colors flex items-center justify-center gap-1.5 sm:gap-2',
					'disabled:opacity-50 disabled:cursor-not-allowed'
				)}
			>
				{hangingUp ? (
					<>
						<Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
						Ending Call...
					</>
				) : (
					<>
						<X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
						{connecting ? 'Cancel Call' : 'End Call'}
					</>
				)}
			</button>
		</div>
	);
}
