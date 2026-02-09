import {
  AlertCircle,
  Camera,
  Eye,
  ImageIcon,
  Link2,
  Loader2,
  Send,
  Trash2,
  Upload,
  X,
  ZoomIn,
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useDropzone } from 'react-dropzone';
import { useVisionPlayground } from '@/hooks/useVisionPlayground';

export default function VisionPlayground() {
  const {
    selectedInstance,
    visionInstances,
    isHealthy,
    error,
    imageSource,
    uploadedImages,
    isLoadingImage,
    activeImageIndex,
    imageUrl,
    isFetchingUrl,
    temperature,
    maxTokens,
    prompt,
    messages,
    isLoading,
    isCameraActive,
    cameraFacingMode,
    cameraError,
    messagesEndRef,
    textareaRef,
    videoRef,
    setSelectedInstance,
    setImageSource,
    setActiveImageIndex,
    setImageUrl,
    setTemperature,
    setMaxTokens,
    setPrompt,
    setCameraFacingMode,
    addFilesAsImages,
    handleAddImageFromUrl,
    startCamera,
    stopCamera,
    captureFromCamera,
    handleSendMessage,
    handleClearConversation,
    removeImage,
    clearImages,
  } = useVisionPlayground();
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'] },
    maxFiles: Math.max(0, 5 - uploadedImages.length),
    maxSize: 10 * 1024 * 1024,
    disabled: isLoadingImage || uploadedImages.length >= 5,
    onDrop: async (acceptedFiles) => {
      await addFilesAsImages(acceptedFiles);
    },
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handlePresetPrompt = (preset: string) => {
    if (uploadedImages.length > 0 && selectedInstance && isHealthy && !isLoading) {
      handleSendMessage(preset);
      return;
    }

    setPrompt(preset);
    textareaRef.current?.focus();
  };

  const activeImage = uploadedImages[activeImageIndex];
  const latestAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');
  const outputText = latestAssistantMessage?.content?.trim() ? latestAssistantMessage.content : null;

  return (
    <TooltipProvider>
      <div className="flex flex-col lg:flex-row h-full min-h-0 bg-white overflow-hidden">
        {/* Left Panel - Controls */}
        <div className="w-full lg:w-[320px] border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col min-h-0 max-h-[45vh] lg:max-h-none">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Vision Playground</h2>
            <p className="text-xs text-slate-500 mt-1">Upload / URL / Camera | Presets | Settings</p>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="p-4 space-y-6">
              {/* Instance */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  Instance
                  {selectedInstance && (
                    <span
                      className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-red-500'}`}
                      title={isHealthy ? 'Online' : 'Offline'}
                    />
                  )}
                </Label>
                <Select
                  value={selectedInstance?.id || ''}
                  onValueChange={(value) => {
                    const instance = visionInstances.find(i => i.id === value);
                    setSelectedInstance(instance || null);
                  }}
                >
                  <SelectTrigger className="bg-white/50">
                    <SelectValue placeholder="Select instance" />
                  </SelectTrigger>
                  <SelectContent>
                    {visionInstances.length === 0 ? (
                      <SelectItem value="none" disabled>No instances available</SelectItem>
                    ) : (
                      visionInstances.map((instance) => (
                        <SelectItem key={instance.id} value={instance.id}>
                          {instance.containerName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {selectedInstance && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono">:{selectedInstance.port}</span>
                    <span>|</span>
                    <span className="truncate">{selectedInstance.modelName || selectedInstance.modelId}</span>
                  </div>
                )}
              </div>

              {/* Image Source */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Image Source</Label>
                <div className="flex gap-1 rounded-md border border-slate-200 bg-slate-50 p-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={imageSource === 'upload' ? 'secondary' : 'ghost'}
                    className="flex-1 h-8"
                    onClick={() => setImageSource('upload')}
                  >
                    <Upload size={14} />
                    Upload
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={imageSource === 'url' ? 'secondary' : 'ghost'}
                    className="flex-1 h-8"
                    onClick={() => setImageSource('url')}
                  >
                    <Link2 size={14} />
                    URL
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={imageSource === 'camera' ? 'secondary' : 'ghost'}
                    className="flex-1 h-8"
                    onClick={() => setImageSource('camera')}
                  >
                    <Camera size={14} />
                    Camera
                  </Button>
                </div>

                {imageSource === 'upload' && (
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-4 text-center transition-all ${
                      isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'
                    } ${uploadedImages.length >= 5 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <input {...getInputProps()} />
                    <ImageIcon className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                    <p className="text-xs text-slate-600">
                      {isDragActive ? 'Drop images here' : 'Drop images or click to browse'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      PNG/JPG/WebP/GIF | Max 10MB | Up to 5 images
                    </p>
                  </div>
                )}

                {imageSource === 'url' && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="h-8"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddImageFromUrl();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-8"
                        onClick={handleAddImageFromUrl}
                        disabled={!imageUrl.trim() || uploadedImages.length >= 5 || isFetchingUrl}
                      >
                        Add
                      </Button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Note: Some URLs may fail due to CORS restrictions.
                    </p>
                  </div>
                )}

                {imageSource === 'camera' && (
                  <div className="space-y-2">
                    <div className="relative rounded-lg overflow-hidden border bg-slate-50">
                      <video
                        ref={videoRef}
                        className={`w-full aspect-video object-cover ${isCameraActive ? 'opacity-100' : 'opacity-0'}`}
                        autoPlay
                        muted
                        playsInline
                      />
                      {!isCameraActive && (
                        <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">
                          Camera is off
                        </div>
                      )}
                    </div>

                    {cameraError && (
                      <p className="text-xs text-red-600">{cameraError}</p>
                    )}

                    <div className="flex gap-2 items-center">
                      {isCameraActive ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-8"
                            onClick={captureFromCamera}
                            disabled={uploadedImages.length >= 5}
                          >
                            Capture
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8"
                            onClick={stopCamera}
                          >
                            Stop
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="h-8"
                          onClick={startCamera}
                        >
                          Start Camera
                        </Button>
                      )}

                      <Select
                        value={cameraFacingMode}
                        onValueChange={(value) => setCameraFacingMode(value as 'environment' | 'user')}
                      >
                        <SelectTrigger className="h-8 w-[120px] bg-white/50">
                          <SelectValue placeholder="Facing" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="environment">Back</SelectItem>
                          <SelectItem value="user">Front</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* Attached Images */}
              {uploadedImages.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-slate-700">
                      Attached ({uploadedImages.length}/5)
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={clearImages}
                    >
                      Clear
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {uploadedImages.map((image, index) => (
                      <div
                        key={image.preview}
                        className={`relative group aspect-square rounded-md overflow-hidden border bg-slate-100 ${
                          index === activeImageIndex ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200'
                        }`}
                        title={image.file.name}
                      >
                        <button
                          type="button"
                          onClick={() => setActiveImageIndex(index)}
                          className="w-full h-full"
                          aria-label={`Select image ${index + 1}`}
                        >
                          <img
                            src={image.preview}
                            alt={image.file.name}
                            className="w-full h-full object-cover"
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white rounded p-0.5"
                          aria-label="Remove image"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Presets */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Preset Prompts</Label>
                <div className="grid gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    onClick={() => handlePresetPrompt('Describe this image')}
                  >
                    Describe this image
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    onClick={() => handlePresetPrompt('Identify all objects in this image')}
                  >
                    Identify all objects
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    onClick={() => handlePresetPrompt('Read the text in this image')}
                  >
                    Read the text in this image
                  </Button>
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700">Settings</Label>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">Temperature</span>
                    <span className="text-xs text-slate-500 font-mono">{temperature[0].toFixed(2)}</span>
                  </div>
                  <Slider
                    value={temperature}
                    onValueChange={setTemperature}
                    min={0}
                    max={1}
                    step={0.05}
                    className="h-[28px]"
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">Max Tokens</span>
                  </div>
                  <Input
                    type="number"
                    value={maxTokens}
                    min={1}
                    max={32768}
                    step={64}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      setMaxTokens(Number.isFinite(next) ? Math.max(1, next) : 1024);
                    }}
                    className="h-8 bg-white/50 text-sm"
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel - Canvas + Chat */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 pt-4 pb-2">
            <div className="h-10 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg flex items-center px-4 justify-between border border-slate-200">
              <span className="text-sm font-medium text-slate-700 flex items-center gap-2 min-w-0">
                <Eye size={16} className="text-slate-600" />
                <span className="truncate">
                  {selectedInstance?.containerName || 'No instance selected'}
                </span>
                {selectedInstance && (
                  <span
                    className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-red-500'}`}
                    title={isHealthy ? 'Online' : 'Offline'}
                  />
                )}
              </span>
              {selectedInstance && (
                <span className="text-xs text-slate-500 font-mono">
                  :{selectedInstance.port} | {isHealthy ? 'Ready' : 'Offline'}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Canvas (fixed) */}
            <div className="px-4 pb-3 space-y-3">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-slate-700">Main Canvas</div>
                    {activeImage && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8">
                            <ZoomIn size={14} />
                            Zoom
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>{activeImage.file.name}</DialogTitle>
                          </DialogHeader>
                          <div className="max-h-[70vh] overflow-auto">
                            <img src={activeImage.preview} alt={activeImage.file.name} className="w-full h-auto" />
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>

                  <div className="w-full rounded-lg border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center h-[45vh] min-h-[220px] max-h-[420px]">
                    {activeImage ? (
                      <img
                        src={activeImage.preview}
                        alt={activeImage.file.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 px-6 text-center">
                        <ImageIcon className="h-12 w-12 mb-3 text-slate-300" />
                        <p className="text-sm font-medium">No image yet</p>
                        <p className="text-xs mt-1">Add an image from Upload / URL / Camera</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {outputText && (
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium text-slate-700 mb-2">Output</div>
                    <div className="text-sm whitespace-pre-wrap break-words max-h-[160px] overflow-auto">
                      {outputText}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Chat Box (scrollable) */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="px-4 pb-4 space-y-4 text-sm">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-slate-400">
                    <p className="text-sm">Chat history will appear here...</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-3 ${
                          message.role === 'user' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-900'
                        }`}
                      >
                        <div className="text-xs font-medium mb-2 opacity-70">
                          {message.role === 'user' ? 'You' : 'Assistant'}
                        </div>
                        {message.images && message.images.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            {message.images.map((img, idx) => (
                              <div key={idx} className="rounded overflow-hidden border border-white/20">
                                <img
                                  src={`data:image/jpeg;base64,${img}`}
                                  alt={`Attached ${idx + 1}`}
                                  className="w-full h-auto"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="whitespace-pre-wrap break-words">{message.content}</div>
                        <div className="text-xs mt-2 opacity-50">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 text-slate-900 rounded-lg px-4 py-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="px-4 pb-4 pt-3 border-t border-slate-200 bg-white">
              <div className="flex justify-end mb-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleClearConversation}
                      disabled={messages.length === 0 && uploadedImages.length === 0}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Clear all</TooltipContent>
                </Tooltip>
              </div>

              <div className="w-full border bg-white rounded-md p-3 border-slate-200">
                <div className="flex gap-2 items-end">
                  <Textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      !selectedInstance
                        ? "Select an instance first..."
                        : !isHealthy
                        ? "Instance offline..."
                        : uploadedImages.length === 0
                        ? "Add an image first (Upload / URL / Camera)..."
                        : "Ask about the image... (Shift+Enter for new line)"
                    }
                    className="flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[60px] max-h-[200px]"
                    disabled={isLoading || !selectedInstance || !isHealthy}
                  />
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={
                      isLoading ||
                      !selectedInstance ||
                      !isHealthy ||
                      (!prompt.trim() && uploadedImages.length === 0)
                    }
                    size="icon"
                    className="h-10 w-10 shrink-0"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send size={18} />}
                  </Button>
                </div>
              </div>

              <div className="text-xs text-slate-400 text-center mt-2">
                Vision AI | Powered by Ollama
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
