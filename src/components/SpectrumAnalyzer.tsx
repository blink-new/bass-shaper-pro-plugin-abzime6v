import { useEffect, useRef } from 'react'
import { AudioProcessor } from './AudioProcessor'

interface SpectrumAnalyzerProps {
  audioProcessor: AudioProcessor | null
  isPlaying: boolean
  className?: string
}

export const SpectrumAnalyzer: React.FC<SpectrumAnalyzerProps> = ({
  audioProcessor,
  isPlaying,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    if (!audioProcessor || !isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      drawStaticSpectrum()
      return
    }

    const animate = () => {
      drawSpectrum()
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [audioProcessor, isPlaying])

  const drawStaticSpectrum = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw background
    const gradient = ctx.createLinearGradient(0, height, 0, 0)
    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.1)')
    gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.1)')
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.1)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Draw frequency labels
    ctx.fillStyle = 'rgba(148, 163, 184, 0.5)'
    ctx.font = '10px monospace'
    ctx.textAlign = 'center'
    
    const labels = ['20Hz', '100Hz', '500Hz', '1kHz', '5kHz', '10kHz', '20kHz']
    labels.forEach((label, index) => {
      const x = (index / (labels.length - 1)) * width
      ctx.fillText(label, x, height - 5)
    })

    // Draw static bars
    const barCount = 64
    const barWidth = width / barCount
    
    for (let i = 0; i < barCount; i++) {
      const barHeight = Math.random() * 20 + 5
      const x = i * barWidth
      const y = height - barHeight
      
      ctx.fillStyle = 'rgba(148, 163, 184, 0.2)'
      ctx.fillRect(x, y, barWidth - 1, barHeight)
    }
  }

  const drawSpectrum = () => {
    const canvas = canvasRef.current
    if (!canvas || !audioProcessor) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Get frequency data
    const analyserData = audioProcessor.getAnalyserData()
    if (!analyserData) return

    const barCount = Math.min(analyserData.length, 128)
    const barWidth = width / barCount

    // Draw background
    const backgroundGradient = ctx.createLinearGradient(0, height, 0, 0)
    backgroundGradient.addColorStop(0, 'rgba(139, 92, 246, 0.05)')
    backgroundGradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.05)')
    backgroundGradient.addColorStop(1, 'rgba(16, 185, 129, 0.05)')
    ctx.fillStyle = backgroundGradient
    ctx.fillRect(0, 0, width, height)

    // Draw frequency bars
    for (let i = 0; i < barCount; i++) {
      const barHeight = (analyserData[i] / 255) * height * 0.9
      const x = i * barWidth
      const y = height - barHeight

      // Create gradient for each bar
      const barGradient = ctx.createLinearGradient(0, y, 0, height)
      
      // Color based on frequency range
      if (i < barCount * 0.2) {
        // Low frequencies (bass) - Purple/Pink
        barGradient.addColorStop(0, 'rgba(236, 72, 153, 0.9)')
        barGradient.addColorStop(1, 'rgba(139, 92, 246, 0.9)')
      } else if (i < barCount * 0.6) {
        // Mid frequencies - Blue
        barGradient.addColorStop(0, 'rgba(59, 130, 246, 0.9)')
        barGradient.addColorStop(1, 'rgba(99, 102, 241, 0.9)')
      } else {
        // High frequencies - Green/Cyan
        barGradient.addColorStop(0, 'rgba(16, 185, 129, 0.9)')
        barGradient.addColorStop(1, 'rgba(34, 197, 94, 0.9)')
      }

      ctx.fillStyle = barGradient
      ctx.fillRect(x, y, barWidth - 1, barHeight)

      // Add glow effect for higher bars
      if (barHeight > height * 0.5) {
        ctx.shadowColor = i < barCount * 0.2 ? '#ec4899' : i < barCount * 0.6 ? '#3b82f6' : '#10b981'
        ctx.shadowBlur = 10
        ctx.fillRect(x, y, barWidth - 1, barHeight)
        ctx.shadowBlur = 0
      }
    }

    // Draw frequency labels
    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)'
    ctx.font = '9px monospace'
    ctx.textAlign = 'center'
    
    const labels = ['20Hz', '100Hz', '500Hz', '1kHz', '5kHz', '10kHz', '20kHz']
    labels.forEach((label, index) => {
      const x = (index / (labels.length - 1)) * width
      ctx.fillText(label, x, height - 2)
    })

    // Draw peak indicators
    const peakThreshold = 200
    for (let i = 0; i < barCount; i++) {
      if (analyserData[i] > peakThreshold) {
        const x = i * barWidth
        ctx.fillStyle = 'rgba(239, 68, 68, 0.8)'
        ctx.fillRect(x, 0, barWidth - 1, 3)
      }
    }
  }

  // Draw initial static spectrum
  useEffect(() => {
    drawStaticSpectrum()
  }, [])

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={400}
        height={150}
        className="w-full h-full bg-slate-900/50 rounded-lg border border-slate-700"
      />
      {!isPlaying && (
        <div className="absolute top-2 right-2 text-xs text-slate-400">
          Real-time spectrum analysis
        </div>
      )}
    </div>
  )
}

export default SpectrumAnalyzer