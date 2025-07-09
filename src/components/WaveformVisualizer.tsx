import { useEffect, useRef, useState } from 'react'
import { AudioProcessor } from './AudioProcessor'

interface WaveformVisualizerProps {
  audioProcessor: AudioProcessor | null
  isPlaying: boolean
  audioFile: File | null
  className?: string
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  audioProcessor,
  isPlaying,
  audioFile,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [waveformData, setWaveformData] = useState<Float32Array | null>(null)

  // Generate waveform data from audio file
  useEffect(() => {
    if (!audioFile) {
      setWaveformData(null)
      return
    }

    const generateWaveform = async () => {
      try {
        const arrayBuffer = await audioFile.arrayBuffer()
        const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
        
        // Downsample audio data for visualization
        const samples = 800 // Number of samples for waveform
        const blockSize = Math.floor(audioBuffer.length / samples)
        const waveData = new Float32Array(samples)
        
        for (let i = 0; i < samples; i++) {
          let sum = 0
          for (let j = 0; j < blockSize; j++) {
            const sampleIndex = i * blockSize + j
            if (sampleIndex < audioBuffer.length) {
              sum += Math.abs(audioBuffer.getChannelData(0)[sampleIndex])
            }
          }
          waveData[i] = sum / blockSize
        }
        
        setWaveformData(waveData)
        audioContext.close()
      } catch (error) {
        console.error('Failed to generate waveform:', error)
      }
    }

    generateWaveform()
  }, [audioFile])

  // Animation loop for real-time visualization
  useEffect(() => {
    if (!audioProcessor || !isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      return
    }

    const animate = () => {
      drawWaveform()
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [audioProcessor, isPlaying, waveformData])

  const drawWaveform = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const centerY = height / 2

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.1)')
    gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.1)')
    gradient.addColorStop(1, 'rgba(139, 92, 246, 0.1)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    if (waveformData) {
      // Draw static waveform
      ctx.beginPath()
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)'
      ctx.lineWidth = 1
      
      for (let i = 0; i < waveformData.length; i++) {
        const x = (i / waveformData.length) * width
        const y = centerY - (waveformData[i] * centerY * 0.8)
        
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.stroke()

      // Draw mirrored waveform
      ctx.beginPath()
      for (let i = 0; i < waveformData.length; i++) {
        const x = (i / waveformData.length) * width
        const y = centerY + (waveformData[i] * centerY * 0.8)
        
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.stroke()
    }

    // Draw frequency spectrum if audio processor is available
    if (audioProcessor && isPlaying) {
      const analyserData = audioProcessor.getAnalyserData()
      if (analyserData) {
        const barWidth = width / analyserData.length
        
        // Draw frequency bars
        for (let i = 0; i < analyserData.length; i++) {
          const barHeight = (analyserData[i] / 255) * height * 0.6
          const x = i * barWidth
          const y = height - barHeight
          
          // Create color based on frequency
          const hue = (i / analyserData.length) * 280 + 200 // Purple to blue
          const alpha = 0.7
          ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${alpha})`
          ctx.fillRect(x, y, barWidth - 1, barHeight)
        }
      }
    }

    // Draw playback progress if playing
    if (audioProcessor && isPlaying) {
      const currentTime = audioProcessor.getCurrentTime()
      const duration = audioProcessor.getDuration()
      
      if (duration > 0) {
        const progress = currentTime / duration
        const progressX = progress * width
        
        // Draw progress line
        ctx.beginPath()
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.8)'
        ctx.lineWidth = 2
        ctx.moveTo(progressX, 0)
        ctx.lineTo(progressX, height)
        ctx.stroke()
        
        // Draw progress glow
        ctx.beginPath()
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)'
        ctx.lineWidth = 8
        ctx.moveTo(progressX, 0)
        ctx.lineTo(progressX, height)
        ctx.stroke()
      }
    }

    // Draw center line
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)'
    ctx.lineWidth = 1
    ctx.moveTo(0, centerY)
    ctx.lineTo(width, centerY)
    ctx.stroke()
  }

  // Draw static waveform when not playing
  useEffect(() => {
    if (!isPlaying) {
      drawWaveform()
    }
  }, [waveformData, isPlaying])

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={800}
        height={200}
        className="w-full h-full bg-slate-900/50 rounded-lg border border-slate-700"
        style={{ imageRendering: 'pixelated' }}
      />
      {!audioFile && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-400">
          <div className="text-center">
            <div className="text-2xl mb-2">🎵</div>
            <div className="text-sm">Load an audio file to see waveform</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WaveformVisualizer