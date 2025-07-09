import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  Upload, 
  Download,
  RotateCcw,
  Volume,
  VolumeX
} from 'lucide-react'
import { AudioProcessor } from './AudioProcessor'

interface AudioControlsProps {
  audioProcessor: AudioProcessor | null
  isPlaying: boolean
  onPlayPause: () => void
  onStop: () => void
  onFileUpload: (file: File) => void
  audioFile: File | null
  volume: number
  onVolumeChange: (volume: number) => void
  isReady: boolean
  error: string | null
}

export const AudioControls: React.FC<AudioControlsProps> = ({
  audioProcessor,
  isPlaying,
  onPlayPause,
  onStop,
  onFileUpload,
  audioFile,
  volume,
  onVolumeChange,
  isReady,
  error
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [level, setLevel] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [previousVolume, setPreviousVolume] = useState(volume)

  // Update time and level
  useEffect(() => {
    if (!audioProcessor || !isPlaying) return

    const interval = setInterval(() => {
      const current = audioProcessor.getCurrentTime()
      const total = audioProcessor.getDuration()
      const currentLevel = audioProcessor.getLevel()
      
      setCurrentTime(current)
      setDuration(total)
      setLevel(currentLevel)

      // Auto-stop when playback ends
      if (current >= total && total > 0) {
        onStop()
      }
    }, 50)

    return () => clearInterval(interval)
  }, [audioProcessor, isPlaying, onStop])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onFileUpload(file)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleMuteToggle = () => {
    if (isMuted) {
      onVolumeChange(previousVolume)
      setIsMuted(false)
    } else {
      setPreviousVolume(volume)
      onVolumeChange(0)
      setIsMuted(true)
    }
  }

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX className="w-4 h-4" />
    if (volume < 50) return <Volume className="w-4 h-4" />
    return <Volume2 className="w-4 h-4" />
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg">
            <Play className="w-4 h-4" />
          </div>
          Audio Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload */}
        <div className="space-y-2">
          <Label>Audio File</Label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 flex-1"
              disabled={!isReady}
            >
              <Upload className="w-4 h-4 mr-2" />
              {audioFile ? audioFile.name : 'Load Audio File'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.wav,.mp3,.ogg,.flac,.aac,.m4a"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 p-2 rounded">
              {error}
            </div>
          )}
        </div>

        {/* Transport Controls */}
        <div className="space-y-4">
          <div className="flex justify-center gap-3">
            <Button
              size="lg"
              onClick={onPlayPause}
              disabled={!audioFile || !isReady}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </Button>
            <Button
              size="lg"
              onClick={onStop}
              disabled={!audioFile || !isReady}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Square className="w-6 h-6" />
            </Button>
            <Button
              size="lg"
              onClick={() => {
                onStop()
                setCurrentTime(0)
              }}
              disabled={!audioFile || !isReady}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <RotateCcw className="w-6 h-6" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm text-slate-400">
              <span className="font-mono">{formatTime(currentTime)}</span>
              <span className="font-mono">{formatTime(duration)}</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="text-xs text-slate-500 text-center">
              {audioFile ? `${Math.round(progress)}% complete` : 'No audio loaded'}
            </div>
          </div>
        </div>

        {/* Volume Control */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMuteToggle}
              className="p-1 h-auto"
            >
              {getVolumeIcon()}
            </Button>
            Volume
          </Label>
          <Slider
            value={[volume]}
            onValueChange={(value) => {
              onVolumeChange(value[0])
              if (value[0] > 0) setIsMuted(false)
            }}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>0%</span>
            <span className="font-mono">{Math.round(volume)}%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Level Meter */}
        <div className="space-y-2">
          <Label>Input Level</Label>
          <div className="relative">
            <Progress value={level} className="h-3" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-mono text-slate-200 drop-shadow-md">
                {Math.round(level)}%
              </span>
            </div>
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>Silent</span>
            <span className={level > 85 ? 'text-red-400' : level > 70 ? 'text-yellow-400' : 'text-green-400'}>
              {level > 85 ? 'Hot' : level > 70 ? 'Good' : 'Low'}
            </span>
            <span>Peak</span>
          </div>
        </div>

        {/* Export Controls */}
        <div className="pt-4 border-t border-slate-700">
          <Button
            variant="outline"
            className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
            disabled={!audioFile || !isReady}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Processed Audio
          </Button>
        </div>

        {/* Status */}
        <div className="text-xs text-slate-500 text-center">
          {!isReady ? 'Initializing audio processor...' : 
           !audioFile ? 'Load an audio file to begin' :
           isPlaying ? 'Playing' : 'Ready'}
        </div>
      </CardContent>
    </Card>
  )
}

export default AudioControls