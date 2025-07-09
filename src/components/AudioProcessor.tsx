import { useEffect, useRef, useState } from 'react'

interface AudioProcessorProps {
  audioFile: File | null
  settings: {
    bassBoost: number
    lowFreq: number
    midFreq: number
    highFreq: number
    saturation: number
    compression: number
    gain: number
    enabled: boolean
  }
  isPlaying: boolean
  onTimeUpdate?: (currentTime: number, duration: number) => void
  onLevelUpdate?: (level: number) => void
}

export class AudioProcessor {
  private audioContext: AudioContext | null = null
  private sourceNode: AudioBufferSourceNode | null = null
  private gainNode: GainNode | null = null
  private bassBoostFilter: BiquadFilterNode | null = null
  private lowFilter: BiquadFilterNode | null = null
  private midFilter: BiquadFilterNode | null = null
  private highFilter: BiquadFilterNode | null = null
  private compressor: DynamicsCompressorNode | null = null
  private analyser: AnalyserNode | null = null
  private audioBuffer: AudioBuffer | null = null
  private startTime: number = 0
  private pausedAt: number = 0
  private isInitialized: boolean = false

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      
      // Create audio nodes
      this.gainNode = this.audioContext.createGain()
      this.bassBoostFilter = this.audioContext.createBiquadFilter()
      this.lowFilter = this.audioContext.createBiquadFilter()
      this.midFilter = this.audioContext.createBiquadFilter()
      this.highFilter = this.audioContext.createBiquadFilter()
      this.compressor = this.audioContext.createDynamicsCompressor()
      this.analyser = this.audioContext.createAnalyser()

      // Configure filters
      this.bassBoostFilter.type = 'lowshelf'
      this.bassBoostFilter.frequency.value = 100
      
      this.lowFilter.type = 'peaking'
      this.lowFilter.frequency.value = 100
      
      this.midFilter.type = 'peaking'
      this.midFilter.frequency.value = 1000
      
      this.highFilter.type = 'peaking'
      this.highFilter.frequency.value = 3000

      // Configure compressor
      this.compressor.threshold.value = -24
      this.compressor.knee.value = 30
      this.compressor.ratio.value = 12
      this.compressor.attack.value = 0.003
      this.compressor.release.value = 0.25

      // Configure analyser
      this.analyser.fftSize = 2048
      this.analyser.smoothingTimeConstant = 0.8

      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize audio processor:', error)
      throw error
    }
  }

  async loadAudioFile(file: File): Promise<void> {
    if (!this.audioContext) await this.initialize()
    
    try {
      const arrayBuffer = await file.arrayBuffer()
      this.audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer)
    } catch (error) {
      console.error('Failed to load audio file:', error)
      throw new Error('Failed to load audio file. Please check the file format.')
    }
  }

  play(): void {
    if (!this.audioContext || !this.audioBuffer) return

    this.stop()
    
    // Create new source node
    this.sourceNode = this.audioContext.createBufferSource()
    this.sourceNode.buffer = this.audioBuffer

    // Connect audio graph
    this.sourceNode
      .connect(this.bassBoostFilter!)
      .connect(this.lowFilter!)
      .connect(this.midFilter!)
      .connect(this.highFilter!)
      .connect(this.compressor!)
      .connect(this.gainNode!)
      .connect(this.analyser!)
      .connect(this.audioContext.destination)

    // Start playback
    const offset = this.pausedAt || 0
    this.sourceNode.start(0, offset)
    this.startTime = this.audioContext.currentTime - offset
    this.pausedAt = 0
  }

  pause(): void {
    if (!this.audioContext || !this.sourceNode) return
    
    this.pausedAt = this.audioContext.currentTime - this.startTime
    this.sourceNode.stop()
    this.sourceNode = null
  }

  stop(): void {
    if (this.sourceNode) {
      this.sourceNode.stop()
      this.sourceNode = null
    }
    this.startTime = 0
    this.pausedAt = 0
  }

  updateSettings(settings: AudioProcessorProps['settings']): void {
    if (!this.isInitialized) return

    // Update gain
    if (this.gainNode) {
      this.gainNode.gain.value = settings.gain / 100
    }

    // Update bass boost
    if (this.bassBoostFilter) {
      this.bassBoostFilter.gain.value = (settings.bassBoost - 50) * 0.5
    }

    // Update frequency filters
    if (this.lowFilter) {
      this.lowFilter.gain.value = (settings.lowFreq - 50) * 0.48 // -24dB to +24dB
    }

    if (this.midFilter) {
      this.midFilter.gain.value = (settings.midFreq - 50) * 0.48
    }

    if (this.highFilter) {
      this.highFilter.gain.value = (settings.highFreq - 50) * 0.48
    }

    // Update compressor
    if (this.compressor) {
      this.compressor.ratio.value = 1 + (settings.compression / 100) * 19 // 1:1 to 20:1
    }
  }

  getCurrentTime(): number {
    if (!this.audioContext) return 0
    return this.audioContext.currentTime - this.startTime
  }

  getDuration(): number {
    return this.audioBuffer?.duration || 0
  }

  getAnalyserData(): Uint8Array | null {
    if (!this.analyser) return null
    
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount)
    this.analyser.getByteFrequencyData(dataArray)
    return dataArray
  }

  getLevel(): number {
    if (!this.analyser) return 0
    
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount)
    this.analyser.getByteFrequencyData(dataArray)
    
    let sum = 0
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i]
    }
    
    return (sum / dataArray.length) / 255 * 100
  }

  isPlaying(): boolean {
    return this.sourceNode !== null
  }

  destroy(): void {
    this.stop()
    if (this.audioContext) {
      this.audioContext.close()
    }
  }
}

export const useAudioProcessor = (props: AudioProcessorProps) => {
  const processorRef = useRef<AudioProcessor | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    processorRef.current = new AudioProcessor()
    
    const initializeProcessor = async () => {
      try {
        await processorRef.current!.initialize()
        setIsReady(true)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize audio processor')
      }
    }

    initializeProcessor()

    return () => {
      if (processorRef.current) {
        processorRef.current.destroy()
      }
    }
  }, [])

  useEffect(() => {
    if (props.audioFile && processorRef.current && isReady) {
      const loadFile = async () => {
        try {
          await processorRef.current!.loadAudioFile(props.audioFile!)
          setError(null)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load audio file')
        }
      }
      loadFile()
    }
  }, [props.audioFile, isReady])

  useEffect(() => {
    if (processorRef.current && isReady) {
      processorRef.current.updateSettings(props.settings)
    }
  }, [props.settings, isReady])

  useEffect(() => {
    if (!processorRef.current || !isReady) return

    if (props.isPlaying) {
      processorRef.current.play()
    } else {
      processorRef.current.pause()
    }
  }, [props.isPlaying, isReady])

  return {
    processor: processorRef.current,
    isReady,
    error
  }
}