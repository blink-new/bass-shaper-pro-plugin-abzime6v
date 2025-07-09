import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'

import { 
  Mic,
  Zap,
  Settings,
  Sliders,
  Waves,
  BarChart3,
  Headphones
} from 'lucide-react'

import { useAudioProcessor } from './components/AudioProcessor'
import AudioControls from './components/AudioControls'
import WaveformVisualizer from './components/WaveformVisualizer'
import SpectrumAnalyzer from './components/SpectrumAnalyzer'

interface AudioSettings {
  bassBoost: number
  lowFreq: number
  midFreq: number
  highFreq: number
  saturation: number
  compression: number
  gain: number
  enabled: boolean
}

function App() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    bassBoost: 50,
    lowFreq: 60,
    midFreq: 50,
    highFreq: 40,
    saturation: 30,
    compression: 40,
    gain: 75,
    enabled: true
  })
  const [recordingTime, setRecordingTime] = useState(0)
  const [preset, setPreset] = useState("custom")
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [volume, setVolume] = useState(75)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([])

  const { processor, isReady, error } = useAudioProcessor({
    audioFile,
    settings: audioSettings,
    isPlaying
  })

  const presets = {
    custom: audioSettings,
    "deep-house": {
      bassBoost: 85,
      lowFreq: 80,
      midFreq: 45,
      highFreq: 30,
      saturation: 60,
      compression: 70,
      gain: 80,
      enabled: true
    },
    "dubstep": {
      bassBoost: 95,
      lowFreq: 90,
      midFreq: 40,
      highFreq: 25,
      saturation: 85,
      compression: 85,
      gain: 85,
      enabled: true
    },
    "techno": {
      bassBoost: 75,
      lowFreq: 75,
      midFreq: 55,
      highFreq: 40,
      saturation: 45,
      compression: 60,
      gain: 78,
      enabled: true
    },
    "trap": {
      bassBoost: 90,
      lowFreq: 85,
      midFreq: 35,
      highFreq: 45,
      saturation: 70,
      compression: 75,
      gain: 82,
      enabled: true
    },
    "minimal": {
      bassBoost: 40,
      lowFreq: 50,
      midFreq: 60,
      highFreq: 55,
      saturation: 20,
      compression: 30,
      gain: 70,
      enabled: true
    }
  }

  // Recording functionality
  useEffect(() => {
    if (isRecording) {
      let interval: NodeJS.Timeout
      
      const startRecording = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          const recorder = new MediaRecorder(stream)
          
          recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              setRecordedChunks(prev => [...prev, event.data])
            }
          }
          
          recorder.onstop = () => {
            stream.getTracks().forEach(track => track.stop())
          }
          
          recorder.start()
          setMediaRecorder(recorder)
          setRecordingTime(0)
          
          interval = setInterval(() => {
            setRecordingTime(prev => prev + 1)
          }, 1000)
          
          toast.success('Recording started')
        } catch (error) {
          console.error('Failed to start recording:', error)
          toast.error('Failed to start recording. Please check microphone permissions.')
          setIsRecording(false)
        }
      }
      
      startRecording()
      
      return () => {
        if (interval) clearInterval(interval)
      }
    } else {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop()
        setMediaRecorder(null)
        
        if (recordedChunks.length > 0) {
          const blob = new Blob(recordedChunks, { type: 'audio/wav' })
          const file = new File([blob], 'recorded_audio.wav', { type: 'audio/wav' })
          setAudioFile(file)
          setRecordedChunks([])
          toast.success('Recording saved and loaded')
        }
      }
    }
  }, [isRecording, mediaRecorder, recordedChunks])

  const handlePresetChange = (value: string) => {
    setPreset(value)
    if (value !== "custom") {
      setAudioSettings(presets[value as keyof typeof presets])
      toast.success(`Applied ${value} preset`)
    }
  }

  const handleSettingChange = (key: keyof AudioSettings, value: number | boolean) => {
    setAudioSettings(prev => ({
      ...prev,
      [key]: value
    }))
    if (preset !== "custom") {
      setPreset("custom")
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleFileUpload = (file: File) => {
    // Validate file type
    const validTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/flac', 'audio/aac']
    if (!validTypes.some(type => file.type.includes(type.split('/')[1]))) {
      toast.error('Please upload a valid audio file (WAV, MP3, OGG, FLAC, AAC)')
      return
    }
    
    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB')
      return
    }
    
    setAudioFile(file)
    setIsPlaying(false)
    toast.success('Audio file loaded successfully')
  }

  const handlePlayPause = () => {
    if (!audioFile) {
      toast.error('Please load an audio file first')
      return
    }
    
    if (!isReady) {
      toast.error('Audio processor not ready. Please wait...')
      return
    }
    
    setIsPlaying(!isPlaying)
  }

  const handleStop = () => {
    setIsPlaying(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
              <Sliders className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Bass Shaper Pro
            </h1>
          </div>
          <p className="text-slate-400 text-lg">
            Professional bass enhancement plugin with real-time waveform visualization
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <Badge variant="secondary" className="bg-purple-600/20 text-purple-300">
              <Waves className="w-3 h-3 mr-1" />
              Real-time Processing
            </Badge>
            <Badge variant="secondary" className="bg-blue-600/20 text-blue-300">
              <BarChart3 className="w-3 h-3 mr-1" />
              Spectrum Analysis
            </Badge>
            <Badge variant="secondary" className="bg-green-600/20 text-green-300">
              <Mic className="w-3 h-3 mr-1" />
              Recording
            </Badge>
          </div>
        </motion.div>

        {/* Waveform Visualizer */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Waves className="w-5 h-5" />
                Waveform Visualizer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WaveformVisualizer
                audioProcessor={processor}
                isPlaying={isPlaying}
                audioFile={audioFile}
                className="h-48"
              />
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left Column - Audio Controls */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <AudioControls
              audioProcessor={processor}
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onStop={handleStop}
              onFileUpload={handleFileUpload}
              audioFile={audioFile}
              volume={volume}
              onVolumeChange={setVolume}
              isReady={isReady}
              error={error}
            />

            {/* Recording Controls */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="w-5 h-5" />
                  Live Recording
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <Button
                    size="lg"
                    onClick={() => setIsRecording(!isRecording)}
                    className={
                      isRecording 
                        ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700' 
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                    }
                  >
                    <Mic className="w-6 h-6 mr-2" />
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                  </Button>
                </div>
                
                {isRecording && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Recording Time</span>
                      <span className="text-lg font-mono font-bold text-red-400">
                        {formatTime(recordingTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-sm text-slate-400">Recording in progress...</span>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Center Column - Bass Shaper */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="xl:col-span-2 space-y-6"
          >
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Bass Shaper Engine
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label>Enable Processing</Label>
                  <Switch
                    checked={audioSettings.enabled}
                    onCheckedChange={(checked) => handleSettingChange('enabled', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <Label>Preset</Label>
                  <Select value={preset} onValueChange={handlePresetChange}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom</SelectItem>
                      <SelectItem value="deep-house">Deep House</SelectItem>
                      <SelectItem value="dubstep">Dubstep</SelectItem>
                      <SelectItem value="techno">Techno</SelectItem>
                      <SelectItem value="trap">Trap</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-lg font-semibold text-purple-400">Bass Boost</Label>
                      <Slider
                        value={[audioSettings.bassBoost]}
                        onValueChange={(value) => handleSettingChange('bassBoost', value[0])}
                        min={0}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Off</span>
                        <span className="font-mono font-bold text-purple-400">{audioSettings.bassBoost}%</span>
                        <span>Max</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Low Frequency (20-200 Hz)</Label>
                      <Slider
                        value={[audioSettings.lowFreq]}
                        onValueChange={(value) => handleSettingChange('lowFreq', value[0])}
                        min={0}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>-24dB</span>
                        <span className="font-mono">{audioSettings.lowFreq}%</span>
                        <span>+24dB</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Mid Frequency (200-2kHz)</Label>
                      <Slider
                        value={[audioSettings.midFreq]}
                        onValueChange={(value) => handleSettingChange('midFreq', value[0])}
                        min={0}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>-24dB</span>
                        <span className="font-mono">{audioSettings.midFreq}%</span>
                        <span>+24dB</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label>High Frequency (2kHz+)</Label>
                      <Slider
                        value={[audioSettings.highFreq]}
                        onValueChange={(value) => handleSettingChange('highFreq', value[0])}
                        min={0}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>-24dB</span>
                        <span className="font-mono">{audioSettings.highFreq}%</span>
                        <span>+24dB</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-lg font-semibold text-blue-400">Saturation</Label>
                      <Slider
                        value={[audioSettings.saturation]}
                        onValueChange={(value) => handleSettingChange('saturation', value[0])}
                        min={0}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Clean</span>
                        <span className="font-mono font-bold text-blue-400">{audioSettings.saturation}%</span>
                        <span>Heavy</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-lg font-semibold text-green-400">Compression</Label>
                      <Slider
                        value={[audioSettings.compression]}
                        onValueChange={(value) => handleSettingChange('compression', value[0])}
                        min={0}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Off</span>
                        <span className="font-mono font-bold text-green-400">{audioSettings.compression}%</span>
                        <span>Max</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column - Spectrum Analyzer */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Spectrum Analyzer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SpectrumAnalyzer
                  audioProcessor={processor}
                  isPlaying={isPlaying}
                  className="h-40"
                />
              </CardContent>
            </Card>

            {/* Settings Panel */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Advanced Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Master Output</Label>
                  <Slider
                    value={[audioSettings.gain]}
                    onValueChange={(value) => handleSettingChange('gain', value[0])}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>0%</span>
                    <span className="font-mono">{audioSettings.gain}%</span>
                    <span>100%</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Processing Status</span>
                    <Badge variant={isReady ? "default" : "secondary"}>
                      {isReady ? "Ready" : "Loading"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Audio Quality</span>
                    <Badge variant="default" className="bg-green-600">
                      HD
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Latency</span>
                    <Badge variant="secondary">
                      Low
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/50">
              <CardContent className="p-4">
                <div className="text-center space-y-2">
                  <div className="flex justify-center">
                    <Headphones className="w-8 h-8 text-purple-300" />
                  </div>
                  <h3 className="font-bold text-purple-300">Pro Audio Engine</h3>
                  <p className="text-sm text-slate-300">
                    Real-time bass processing with advanced algorithms for professional electronic music production
                  </p>
                  <div className="flex justify-center gap-4 text-xs text-slate-400">
                    <span>• 32-bit processing</span>
                    <span>• Zero latency</span>
                    <span>• VST compatible</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default App