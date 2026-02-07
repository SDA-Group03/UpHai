import React, { useState, useEffect, useRef } from 'react';
import { Info, Upload, Mic, Trash2, Loader2, Download, Play, Pause } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { getUserInstances } from '@/services/dockerService';
import { fetchProfile } from '@/services/authService';

interface AudioTask {
  id: string;
  audioFile: File | null;
  audioUrl: string | null;
  result: string;
  timestamp: number;
  duration?: number;
}

interface WhisperInstance {
  id: string;
  modelId: string;
  modelName: string | null;
  containerName: string;
  port: number;
  status: string;
}

export default function AudioPlayground() {
  // Model & Instance State
  const [selectedInstance, setSelectedInstance] = useState<WhisperInstance | null>(null);
  const [whisperInstances, setWhisperInstances] = useState<WhisperInstance[]>([]);
  
  // Model Parameters
  const [task, setTask] = useState<'transcribe' | 'translate'>('transcribe');
  const [temperature, setTemperature] = useState([0.0]);
  const [stream, setStream] = useState(true);
  
  // Audio State
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState('');
  const [history, setHistory] = useState<AudioTask[]>([]);
  
  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Load Whisper instances
  useEffect(() => {
    const fetchWhisperInstances = async () => {
      try {
        const user = await fetchProfile();
        if (!user) return;

        const response = await getUserInstances(String(user.id), { engineId: 'whisper' });
        if (!response.success) return;

        const instances = Array.isArray(response.data) ? (response.data as WhisperInstance[]) : [];
        setWhisperInstances(instances);
        setSelectedInstance(instances[0] || null);
      } catch (error) {
        console.error('Failed to fetch whisper instances:', error);
      }
    };

    fetchWhisperInstances();
  }, []);

  // Audio file upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if file is audio
      if (!file.type.startsWith('audio/')) {
        alert('Please select an audio file');
        return;
      }
      
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setResult('');
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        const file = new File([blob], 'recording.wav', { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        
        setAudioFile(file);
        setAudioUrl(url);
        setResult('');
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to access microphone');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Play/Pause audio
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Update audio time
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // Update audio duration
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // Format time (seconds to mm:ss)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Process audio (transcribe/translate)
  const handleProcessAudio = async () => {
    if (!audioFile || !selectedInstance || isProcessing) return;

    setIsProcessing(true);
    setResult('');

    try {
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', selectedInstance.modelName || selectedInstance.modelId);
      formData.append('task', task);
      formData.append('temperature', temperature[0].toString());
      formData.append('stream', stream.toString());

      const response = await fetch(`http://localhost:${selectedInstance.port}/v1/audio/transcriptions`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Processing failed');
      }

      if (stream) {
        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            fullText += chunk;
            setResult(fullText);
          }
        }
      } else {
        // Handle complete response
        const data = await response.json();
        setResult(data.text || '');
      }

      // Add to history
      const newTask: AudioTask = {
        id: Date.now().toString(),
        audioFile: audioFile,
        audioUrl: audioUrl,
        result: result,
        timestamp: Date.now(),
        duration: duration
      };
      setHistory([newTask, ...history]);

    } catch (error) {
      console.error('Processing error:', error);
      setResult('Error processing audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Clear current audio and result
  const handleClear = () => {
    if (confirm('Are you sure you want to clear the current audio?')) {
      setAudioFile(null);
      setAudioUrl(null);
      setResult('');
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Download result as text file
  const handleDownloadResult = () => {
    if (!result) return;

    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-slate-50">
        {/* Left Panel - Controls */}
        <div className="max-w-[262px] min-w-[262px] bg-transparent border-r border-slate-200 flex flex-col">
          <ScrollArea className="flex-1 p-5 pb-2.5 pl-0 pr-2 overflow-y-auto overflow-x-hidden">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                {/* Instance Selection */}
                <div className="w-full grid gap-1">
                  <div className="text-sm text-slate-700">Whisper Instance</div>
                  <Select 
                    value={selectedInstance?.id || ''} 
                    onValueChange={(value) => {
                      const instance = whisperInstances.find(i => i.id === value);
                      setSelectedInstance(instance || null);
                    }}
                  >
                    <SelectTrigger className="w-full bg-white/50">
                      <SelectValue placeholder="Select an instance" />
                    </SelectTrigger>
                    <SelectContent>
                      {whisperInstances.map((instance) => (
                        <SelectItem key={instance.id} value={instance.id}>
                          {instance.containerName} (:{instance.port})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Task Selection */}
                <div className="w-full grid gap-1">
                  <div className="text-sm text-slate-700">Task</div>
                  <Select 
                    value={task} 
                    onValueChange={(value: 'transcribe' | 'translate') => setTask(value)}
                  >
                    <SelectTrigger className="w-full bg-white/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transcribe">Transcribe</SelectItem>
                      <SelectItem value="translate">Translate to English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Model Parameters */}
                <div className="model-form">
                  <div className="space-y-4">
                    {/* Temperature */}
                    <div className="grid gap-2 mb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Label className="text-sm text-slate-700">Temperature</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info size={12} className="text-slate-400 cursor-help relative top-[-2px]" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs text-xs">Controls randomness in transcription. 0 = deterministic</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input
                          type="number"
                          value={temperature[0]}
                          onChange={(e) => setTemperature([Number(e.target.value)])}
                          className="w-[90px] h-8 bg-white/50 text-sm"
                          step="0.1"
                          min="0"
                          max="1"
                        />
                      </div>
                      <Slider
                        value={temperature}
                        onValueChange={setTemperature}
                        max={1}
                        step={0.1}
                        className="mt-0 mb-0 h-[28px]"
                      />
                    </div>

                    {/* Stream Option */}
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-1">
                        <Label className="text-sm text-slate-700">Stream Results</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info size={12} className="text-slate-400 cursor-help relative top-[-2px]" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs text-xs">Show results as they are generated</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Switch
                        checked={stream}
                        onCheckedChange={setStream}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Divider */}
        <div className="min-w-[1px] my-[8px]" style={{background: 'linear-gradient(to bottom, rgb(252, 252, 252), rgb(230, 230, 230), rgb(252, 252, 252)), rgb(230, 230, 230)'}} />

        {/* Right Panel - Audio Processing Area */}
        <div className="flex-1 flex flex-col h-full box-border overflow-hidden">
          {/* Header */}
          <div className="px-4 pt-2">
            <div className="h-[36px] bg-slate-100 rounded-md flex items-center px-3 justify-between mb-4">
              <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                {selectedInstance?.containerName || 'No instance selected'}
              </span>
              {selectedInstance && (
                <span className="text-xs text-slate-500">
                  Port: {selectedInstance.port}
                </span>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="px-4 pb-4">
              {/* Audio Upload/Record Area */}
              <div className="bg-white rounded-lg border border-slate-200 p-6 mb-4">
                <div className="text-sm font-medium text-slate-700 mb-4">Audio Input</div>
                
                {/* Audio Player */}
                {audioUrl && (
                  <div className="mb-4">
                    <audio
                      ref={audioRef}
                      src={audioUrl}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onEnded={() => setIsPlaying(false)}
                      className="hidden"
                    />
                    
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="flex items-center gap-4 mb-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={togglePlayPause}
                          className="h-10 w-10"
                        >
                          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                        </Button>
                        
                        <div className="flex-1">
                          <div className="text-xs text-slate-500 mb-1">
                            {formatTime(currentTime)} / {formatTime(duration)}
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-slate-500">
                        {audioFile?.name || 'Audio file'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload/Record Buttons */}
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isRecording || isProcessing}
                  >
                    <Upload size={16} className="mr-2" />
                    Upload Audio
                  </Button>
                  
                  {!isRecording ? (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={startRecording}
                      disabled={isProcessing}
                    >
                      <Mic size={16} className="mr-2" />
                      Record
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={stopRecording}
                    >
                      <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                      Stop Recording
                    </Button>
                  )}
                </div>
              </div>

              {/* Result Area */}
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-medium text-slate-700">
                    {task === 'transcribe' ? 'Transcription' : 'Translation'}
                  </div>
                  
                  <div className="flex gap-2">
                    {result && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleDownloadResult}
                          >
                            <Download size={16} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Download result</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={handleClear}
                          disabled={!audioFile && !result}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Clear</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                <Textarea
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  placeholder={
                    audioFile 
                      ? "Click 'Process' to start transcription..." 
                      : "Upload or record audio to begin..."
                  }
                  className="min-h-[300px] text-sm resize-none bg-slate-50"
                  readOnly={isProcessing}
                />
              </div>
            </div>
          </ScrollArea>

          {/* Bottom Controls */}
          <div className="px-4 pb-4">
            <Button
              onClick={handleProcessAudio}
              disabled={!audioFile || !selectedInstance || isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {task === 'transcribe' ? 'Transcribe' : 'Translate'}
                </>
              )}
            </Button>

            <div className="text-xs text-slate-400 text-center mt-2">
              Powered by Whisper AI
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
