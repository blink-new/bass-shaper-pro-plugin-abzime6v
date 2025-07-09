import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'

import { 
  Play, 
  Pause, 
  Square,
  Mic,
  Music,
  Volume2,
  Zap,
  Settings,
  Download,
  Upload,
  Sliders
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { motion } from 'framer-motion'

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
  const [level, setLevel] = useState(0)
  const [preset, setPreset] = useState("custom")
  const [audioFile, setAudioFile] = useState<File | null>(null)
  
  const intervalRef = useRef<NodeJS.Timeout>()
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    }
  }

  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
        setLevel(Math.random() * 100)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRecording])

  const handlePresetChange = (value: string) => {
    setPreset(value)
    if (value !== "custom") {
      setAudioSettings(presets[value as keyof typeof presets])
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setAudioFile(file)
    }
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
            Professional bass enhancement plugin for electronic music production
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <Badge variant="secondary" className="bg-purple-600/20 text-purple-300">
              DAW Plugin
            </Badge>
            <Badge variant="secondary" className="bg-blue-600/20 text-blue-300">
              Standalone
            </Badge>
            <Badge variant="secondary" className="bg-green-600/20 text-green-300">
              Recording
            </Badge>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Audio Controls */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Transport Controls */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="w-5 h-5" />
                  Transport
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center gap-4">
                  <Button
                    size="lg"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => setIsPlaying(false)}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <Square className="w-6 h-6" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label>Audio File</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700 flex-1"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {audioFile ? audioFile.name : "Load Audio"}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recording Controls */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="w-5 h-5" />
                  Recording
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <Button
                    size="lg"
                    onClick={() => {
                      setIsRecording(!isRecording)
                      if (!isRecording) {
                        setRecordingTime(0)
                      }
                    }}
                    className={`${
                      isRecording 
                        ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700' 
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                    }`}
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
                    <Progress value={level} className="h-2" />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Level</span>
                      <span>{Math.round(level)}%</span>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Output Controls */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5" />
                  Output
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Master Gain</Label>
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
                
                <Button
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Audio
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Center Column - Bass Shaper */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Bass Shaper
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
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

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
                      <span className="font-mono font-bold text-purple-400">{audioSettings.midFreq}%</span>
                      <span>+24dB</span>
                    </div>
                  </div>

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
                      <span className="font-mono font-bold text-purple-400">{audioSettings.highFreq}%</span>
                      <span>+24dB</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column - Effects */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Effects
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
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
              </CardContent>
            </Card>

            {/* Spectrum Analyzer Placeholder */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle>Spectrum Analyzer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-40 bg-slate-900/50 rounded-lg flex items-end justify-center gap-1 p-4">
                  {Array.from({ length: 32 }, (_, i) => (
                    <motion.div
                      key={i}
                      className="bg-gradient-to-t from-purple-600 to-blue-400 rounded-t-sm flex-1"
                      style={{
                        height: `${Math.random() * 100}%`,
                        minHeight: '2px'
                      }}
                      animate={{
                        height: `${Math.random() * 100}%`
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.5,
                        delay: i * 0.05
                      }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/50">
              <CardContent className="p-4">
                <div className="text-center space-y-2">
                  <h3 className="font-bold text-purple-300">Pro Features</h3>
                  <p className="text-sm text-slate-300">
                    Advanced bass processing algorithms designed for electronic music production
                  </p>
                  <div className="flex justify-center gap-4 text-xs text-slate-400">
                    <span>• Real-time processing</span>
                    <span>• VST/AU support</span>
                    <span>• MIDI control</span>
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