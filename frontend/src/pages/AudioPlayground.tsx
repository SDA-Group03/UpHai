import { useState, useEffect, useRef } from "react";
import { Info, Download, Trash2, Loader2, AlertCircle, Upload, FileAudio, Play, Pause, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { useDropzone } from "react-dropzone";
import { useVoiceVisualizer, VoiceVisualizer } from "react-voice-visualizer";
import WaveSurfer from "wavesurfer.js";
import { useInterval } from "react-use";
import { getUserInstances } from "@/services/dockerService";
import { fetchProfile } from "@/services/authService";
import {
  transcribeAudio,
  translateAudio,
  checkWhisperHealth,
  createAudioURL,
  revokeAudioURL,
  validateAudioFile,
} from "@/services/audioService";

interface WhisperInstance {
  id: string;
  modelId: string;
  modelName: string | null;
  containerName: string;
  port: number;
  status: string;
}

interface AudioTask {
  id: string;
  audioFile: File;
  result: string;
  timestamp: number;
  task: "transcribe" | "translate";
}

const SUPPORTED_LANGUAGES = [
  { value: "auto", label: "Auto Detect" },
  { value: "en", label: "🇺🇸 English" },
  { value: "th", label: "🇹🇭 Thai" },
  { value: "zh", label: "🇨🇳 Chinese" },
  { value: "ja", label: "🇯🇵 Japanese" },
  { value: "ko", label: "🇰🇷 Korean" },
  { value: "es", label: "🇪🇸 Spanish" },
  { value: "fr", label: "🇫🇷 French" },
  { value: "de", label: "🇩🇪 German" },
  { value: "it", label: "🇮🇹 Italian" },
  { value: "pt", label: "🇵🇹 Portuguese" },
  { value: "ru", label: "🇷🇺 Russian" },
  { value: "ar", label: "🇸🇦 Arabic" },
  { value: "hi", label: "🇮🇳 Hindi" },
];

export default function AudioPlayground() {
  // Instance & Settings
  const [selectedInstance, setSelectedInstance] = useState<WhisperInstance | null>(null);
  const [whisperInstances, setWhisperInstances] = useState<WhisperInstance[]>([]);
  const [isHealthy, setIsHealthy] = useState(false);

  // Parameters
  const [task, setTask] = useState<"transcribe" | "translate">("transcribe");
  const [language, setLanguage] = useState("auto");
  const [temperature, setTemperature] = useState([0.0]);
  const [stream, setStream] = useState(true);

  // Audio & Processing
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AudioTask[]>([]);

  // Audio playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Refs
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // React Voice Visualizer Hook (for recording)
  const recorderControls = useVoiceVisualizer();
  const { recordedBlob, error: recorderError, isRecordingInProgress, recordingTime } = recorderControls;

  // Dropzone for drag & drop
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "audio/*": [".mp3", ".wav", ".m4a", ".ogg", ".flac", ".webm", ".aac"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        handleAudioFile(acceptedFiles[0]);
      }
    },
  });

  // Load instances
  useEffect(() => {
    const fetchInstances = async () => {
      try {
        const user = await fetchProfile();
        if (!user) return;

        const response = await getUserInstances(String(user.id), { engineId: "whisper" });
        if (!response.success) return;

        const instances = Array.isArray(response.data) ? (response.data as WhisperInstance[]) : [];
        setWhisperInstances(instances);
        if (instances.length > 0) setSelectedInstance(instances[0]);
      } catch (err) {
        console.error("Failed to fetch instances:", err);
        setError("Failed to load Whisper instances");
      }
    };

    fetchInstances();
  }, []);

  // Health check interval
  useInterval(
    () => {
      if (!selectedInstance) return;
      checkWhisperHealth(selectedInstance.port).then((healthy) => {
        setIsHealthy(healthy);
        if (!healthy && !error?.includes("Processing")) {
          setError(`Instance ${selectedInstance.containerName} is not responding`);
        } else if (healthy && error?.includes("not responding")) {
          setError(null);
        }
      });
    },
    selectedInstance ? 30000 : null,
  );

  // Initial health check
  useEffect(() => {
    if (!selectedInstance) {
      setIsHealthy(false);
      return;
    }

    checkWhisperHealth(selectedInstance.port).then((healthy) => {
      setIsHealthy(healthy);
      if (!healthy) {
        setError(`Instance ${selectedInstance.containerName} is not responding. Check if container is running.`);
      }
    });
  }, [selectedInstance]);

  // Handle recorded audio
  useEffect(() => {
    if (recordedBlob && !isRecordingInProgress) {
      const file = new File([recordedBlob], `recording-${Date.now()}.webm`, {
        type: recordedBlob.type || "audio/webm",
      });
      handleAudioFile(file);
    }
  }, [recordedBlob, isRecordingInProgress]);

  // Handle recorder errors
  useEffect(() => {
    if (recorderError) {
      setError("Microphone error: " + recorderError.message);
    }
  }, [recorderError]);

  // Initialize WaveSurfer when audio file changes
  useEffect(() => {
    if (!audioFile || !waveformRef.current) {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
      return;
    }

    // Destroy previous instance
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
    }

    // Create new WaveSurfer instance
    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "#94a3b8",
      progressColor: "#3b82f6",
      cursorColor: "#1e40af",
      barWidth: 2,
      barRadius: 3,
      cursorWidth: 2,
      height: 80,
      barGap: 2,
      normalize: true,
      interact: true,
    });

    // Load audio file
    ws.loadBlob(audioFile);

    // Event listeners
    ws.on("ready", () => {
      setDuration(ws.getDuration());
    });

    ws.on("audioprocess", () => {
      setCurrentTime(ws.getCurrentTime());
    });

    ws.on("seeking", () => {
      setCurrentTime(ws.getCurrentTime());
    });

    ws.on("finish", () => {
      setIsPlaying(false);
    });

    wavesurferRef.current = ws;

    return () => {
      ws.destroy();
    };
  }, [audioFile]);

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioURL) {
        revokeAudioURL(audioURL);
      }
    };
  }, [audioURL]);

  // Handle audio file
  const handleAudioFile = (file: File) => {
    // Validate file
    const validation = validateAudioFile(file);
    if (!validation.valid) {
      setError(validation.error || "Invalid audio file");
      return;
    }

    // Clean up previous audio URL
    if (audioURL) {
      revokeAudioURL(audioURL);
    }

    setAudioFile(file);

    // Create new audio URL for playback
    const url = createAudioURL(file);
    setAudioURL(url);

    setResult("");
    setError(null);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Play/Pause audio
  const togglePlayPause = () => {
    if (!wavesurferRef.current) return;

    if (isPlaying) {
      wavesurferRef.current.pause();
    } else {
      wavesurferRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Process audio
  const handleProcess = async () => {
    if (!audioFile || !selectedInstance || !isHealthy || isProcessing) return;

    setIsProcessing(true);
    setResult("");
    setError(null);

    try {
      const options = {
        model: selectedInstance.modelName || undefined,
        temperature: temperature[0],
        stream,
        response_format: "text" as const,
        ...(task === "transcribe" && language !== "auto" ? { language } : {}),
      };

      let finalResult = "";

      if (task === "transcribe") {
        const response = await transcribeAudio(
          selectedInstance.port,
          audioFile,
          options,
          stream
            ? (chunk) => {
                setResult((prev) => prev + chunk);
                finalResult += chunk;
              }
            : undefined,
        );

        if (!stream) {
          finalResult = response.text;
          setResult(finalResult);
        }
      } else {
        const response = await translateAudio(
          selectedInstance.port,
          audioFile,
          options,
          stream
            ? (chunk) => {
                setResult((prev) => prev + chunk);
                finalResult += chunk;
              }
            : undefined,
        );

        if (!stream) {
          finalResult = response.text;
          setResult(finalResult);
        }
      }

      // Add to history
      setHistory((prev) => [
        {
          id: `task_${Date.now()}`,
          audioFile,
          result: finalResult || result,
          timestamp: Date.now(),
          task,
        },
        ...prev.slice(0, 9),
      ]);
    } catch (err) {
      console.error("Processing error:", err);
      const errorMessage = err instanceof Error ? err.message : "Processing failed";
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Download result
  const handleDownload = () => {
    if (!result) return;

    const blob = new Blob([result], { type: "text/plain; charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `whisper-${task}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Clear
  const handleClear = () => {
    if (audioURL) {
      revokeAudioURL(audioURL);
    }

    setAudioFile(null);
    setAudioURL(null);
    setResult("");
    setError(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    recorderControls.clearCanvas();

    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
    }
  };

  // Load from history
  const handleLoadFromHistory = (item: AudioTask) => {
    handleAudioFile(item.audioFile);
    setResult(item.result);
    setTask(item.task);
  };

  // Format time
  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <TooltipProvider>
      <div className="flex h-full bg-white">
        {/* Left Panel - Settings */}
        <div className="w-[320px] border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Audio Settings</h2>
            <p className="text-xs text-slate-500 mt-1">Configure Whisper AI</p>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* Instance Selector */}
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  Instance
                  {selectedInstance && (
                    <span
                      className={`w-2 h-2 rounded-full ${isHealthy ? "bg-green-500" : "bg-red-500"}`}
                      title={isHealthy ? "Online" : "Offline"}
                    />
                  )}
                </Label>
                <Select
                  value={selectedInstance?.id || ""}
                  onValueChange={(value) => {
                    const instance = whisperInstances.find((i) => i.id === value);
                    setSelectedInstance(instance || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select instance" />
                  </SelectTrigger>
                  <SelectContent>
                    {whisperInstances.length === 0 ? (
                      <div className="p-2 text-sm text-slate-500">No instances available</div>
                    ) : (
                      whisperInstances.map((instance) => (
                        <SelectItem key={instance.id} value={instance.id}>
                          {instance.containerName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {selectedInstance && (
                  <p className="text-xs text-slate-500 mt-1">
                    Port: {selectedInstance.port} • {isHealthy ? "✓ Ready" : "✗ Offline"}
                  </p>
                )}
              </div>

              {/* Task */}
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">Task</Label>
                <Select value={task} onValueChange={(v) => setTask(v as typeof task)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transcribe">Transcribe</SelectItem>
                    <SelectItem value="translate">Translate to English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Language */}
              {task === "transcribe" && (
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Temperature */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium  text-slate-700">Temperature</Label>
                  <span className="text-sm text-slate-600 font-mono">{temperature[0].toFixed(1)}</span>
                </div>
                <Slider
                  value={temperature}
                  onValueChange={setTemperature}
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {temperature[0] === 0 ? "Most Accurate" : temperature[0] < 0.5 ? "Balanced" : "Creative"}
                </p>
              </div>

              {/* Stream */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium text-slate-700">Stream Results</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info size={14} className="text-slate-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">See results in real-time</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Switch checked={stream} onCheckedChange={setStream} />
              </div>

              {/* History */}
              {history.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">Recent Tasks</Label>
                  <div className="space-y-2">
                    {history.slice(0, 5).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleLoadFromHistory(item)}
                        className="w-full p-3 text-left bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-all hover:border-slate-300"
                      >
                        <div className="flex items-center gap-2">
                          <FileAudio size={14} className="text-slate-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-slate-700 truncate">{item.audioFile.name}</div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {new Date(item.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Divider */}
        <div
          className="min-w-[1px] my-2"
          style={{ background: "linear-gradient(to bottom, #fafafa, #e5e5e5, #fafafa)" }}
        />

        {/* Right Panel - Processing */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="px-4 pt-4 pb-2">
            <div className="h-10 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg flex items-center px-4 justify-between border border-slate-200">
              <span className="text-sm font-medium text-slate-700">
                {selectedInstance?.containerName || "No instance selected"}
              </span>
              {selectedInstance && <span className="text-xs text-slate-500 font-mono">:{selectedInstance.port}</span>}
            </div>
          </div>

          {/* Main Content */}
          <ScrollArea className="flex-1">
            <div className="px-4 pb-4 space-y-4">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {/* Audio Input Section */}
              <Card>
                <CardContent className="p-6">
                  <div className="text-sm font-medium text-slate-700 mb-4">Audio Input</div>

                  {/* Voice Recorder with Visualizer */}
                  <div className="mb-4">
                    <VoiceVisualizer
                      controls={recorderControls}
                      height="100px"
                      mainBarColor="#3b82f6"
                      secondaryBarColor="#94a3b8"
                      speed={3}
                      barWidth={2}
                      gap={1}
                      rounded={3}
                      isControlPanelShown={true}
                      isDownloadAudioButtonShown={false}
                    />
                    {isRecordingInProgress && recordingTime > 0 && (
                      <p className="text-xs text-slate-500 mt-2 text-center">Recording: {formatTime(recordingTime)}</p>
                    )}
                  </div>

                  {/* Dropzone */}
                  <div
                    {...getRootProps()}
                    className={`
                      border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
                      ${
                        isDragActive
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-300 hover:border-slate-400 bg-slate-50"
                      }
                    `}
                  >
                    <input {...getInputProps()} />
                    <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                    {isDragActive ? (
                      <p className="text-sm text-blue-600 font-medium">Drop your audio file here</p>
                    ) : (
                      <>
                        <p className="text-sm text-slate-600 font-medium">Drag & drop audio file here</p>
                        <p className="text-xs text-slate-500 mt-1">
                          or click to browse (MP3, WAV, M4A, OGG, FLAC, max 25MB)
                        </p>
                      </>
                    )}
                  </div>

                  {/* Current Audio with Waveform */}
                  {audioFile && audioURL && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FileAudio size={16} className="text-slate-500 flex-shrink-0" />
                          <span className="text-sm text-slate-700 font-medium truncate">{audioFile.name}</span>
                        </div>
                        <span className="text-xs text-slate-500 ml-2">
                          {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>

                      {/* Waveform Container */}
                      <div className="bg-slate-50 rounded-lg border border-slate-200 p-3">
                        {/* Waveform */}
                        <div ref={waveformRef} className="mb-2 rounded overflow-hidden" />

                        {/* Playback Controls */}
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={togglePlayPause}
                            className="h-8 w-8 flex-shrink-0"
                            disabled={!wavesurferRef.current}
                          >
                            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                          </Button>

                          <div className="flex-1 text-xs text-slate-600 font-mono">
                            {formatTime(currentTime)} / {formatTime(duration)}
                          </div>

                          <Volume2 size={14} className="text-slate-400" />
                        </div>
                      </div>

                      {/* Hidden audio element for compatibility */}
                      <audio ref={audioRef} src={audioURL} className="hidden" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Result Section */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-medium text-slate-700">
                      {task === "transcribe" ? "Transcription" : "Translation"}
                    </div>

                    <div className="flex gap-2">
                      {result && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleDownload}>
                              <Download size={16} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Download result</TooltipContent>
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
                        <TooltipContent>Clear all</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  <Textarea
                    value={result}
                    onChange={(e) => setResult(e.target.value)}
                    placeholder={
                      !selectedInstance
                        ? "Please select a Whisper instance first..."
                        : !isHealthy
                          ? "Instance is offline. Check if the container is running..."
                          : audioFile
                            ? `Click "${task === "transcribe" ? "Transcribe" : "Translate"}" to start processing...`
                            : "Record or upload audio to begin..."
                    }
                    className="min-h-[250px] text-sm resize-none bg-slate-50 font-mono leading-relaxed"
                    readOnly={isProcessing}
                  />

                  {isProcessing && stream && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <span className="animate-pulse">Processing audio stream...</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>

          {/* Bottom Action */}
          <div className="px-4 pb-4 pt-2 border-t border-slate-200">
            <Button
              onClick={handleProcess}
              disabled={!audioFile || !selectedInstance || isProcessing || !isHealthy}
              className="w-full h-11 text-base font-medium"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>{task === "transcribe" ? "Transcribe Audio" : "Translate Audio"}</>
              )}
            </Button>

            <p className="text-xs text-slate-400 text-center mt-2">Powered by Whisper AI • OpenAI-compatible API</p>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
