import { useState, useEffect, useRef } from 'react';
import { Info, Send, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getUserInstances } from '@/services/dockerService';
import { fetchProfile } from '@/services/authService';
import { useInterval } from 'react-use';
import { useChatHistory } from '../hooks/useChatHistory';
import type { ChatOptions } from '../services/chatService';
import { sendMessage, checkOllamaHealth } from '../services/chatService';

interface UserInstance {
  id: string;
  modelId: string;
  modelName: string | null;
  modelCategory?: string | null;
  containerName: string;
  port: number;
  status: string;
}

export default function ChatPlayground() {
  // Model & Instance State
  const [selectedInstance, setSelectedInstance] = useState<UserInstance | null>(null);
  const [userInstances, setUserInstances] = useState<UserInstance[]>([]);
  const [isHealthy, setIsHealthy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Model Parameters
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant.');
  const [maxTokens, setMaxTokens] = useState(8192);
  const [temperature, setTemperature] = useState([0.7]);
  const [topP, setTopP] = useState([0.9]);
  const [topK, setTopK] = useState([40]);
  const [frequencyPenalty, setFrequencyPenalty] = useState([0.0]);

  // Chat State
  const [prompt, setPrompt] = useState('');
  const { messages, addMessage, updateLastMessage, clearMessages, isLoading, setIsLoading } = useChatHistory();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load user instances
  useEffect(() => {
    const fetchUserInstances = async () => {
      try {
        const user = await fetchProfile();
        if (user) {
          const response = await getUserInstances(user.id.toString(), { engineId: 'ollama' });
          if (response.success) {
            const instances = Array.isArray(response.data) ? (response.data as UserInstance[]) : [];
            const chatInstances = instances.filter(
              (inst) => String(inst.modelCategory ?? '').toLowerCase() === 'chat'
            );
            setUserInstances(chatInstances);
            setSelectedInstance(chatInstances[0] || null);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user instances:", error);
        setError('Failed to load Ollama instances');
      }
    };

    fetchUserInstances();
  }, []);

  // Health check interval
  useInterval(
    () => {
      if (!selectedInstance) return;
      checkOllamaHealth(selectedInstance.port).then((healthy) => {
        setIsHealthy(healthy);
        if (!healthy && !isLoading) {
          setError(`Instance ${selectedInstance.containerName} is not responding`);
        } else if (healthy && error?.includes('not responding')) {
          setError(null);
        }
      });
    },
    selectedInstance ? 30000 : null
  );

  // Initial health check
  useEffect(() => {
    if (!selectedInstance) {
      setIsHealthy(false);
      setError(null);
      return;
    }

    checkOllamaHealth(selectedInstance.port).then((healthy) => {
      setIsHealthy(healthy);
      if (!healthy) {
        setError(`Instance ${selectedInstance.containerName} is not responding. Check if container is running.`);
      } else {
        setError(null);
      }
    });
  }, [selectedInstance]);

  // Handle send message
  const handleSendMessage = async () => {
    if (!prompt.trim() || !selectedInstance || isLoading || !isHealthy) return;

    const userMessage = prompt.trim();
    setPrompt('');
    setError(null);
    setIsLoading(true);

    // Add user message
    addMessage({
      role: 'user',
      content: userMessage,
    });

    // Add empty assistant message for streaming
    addMessage({
      role: 'assistant',
      content: '',
    });

    // Prepare messages for API (include system prompt if exists)
    const apiMessages = [
      ...(systemPrompt ? [{ 
        id: 'system', 
        role: 'system' as const, 
        content: systemPrompt,
        timestamp: Date.now()
      }] : []),
      ...messages,
      {
        id: 'temp',
        role: 'user' as const,
        content: userMessage,
        timestamp: Date.now()
      }
    ];

    const options: ChatOptions = {
      model: selectedInstance.modelName || selectedInstance.modelId,
      temperature: temperature[0],
      top_p: topP[0],
      top_k: topK[0],
      max_tokens: maxTokens,
      frequency_penalty: frequencyPenalty[0],
      system: systemPrompt,
    };

    let fullResponse = '';

    await sendMessage(
      selectedInstance.port.toString(),
      apiMessages,
      options,
      // onChunk - เรียกทุกครั้งที่ได้ข้อมูลใหม่
      (chunk) => {
        fullResponse += chunk;
        updateLastMessage(fullResponse);
      },
      // onComplete - เรียกเมื่อเสร็จสิ้น
      () => {
        setIsLoading(false);
      },
      // onError - เรียกเมื่อเกิดข้อผิดพลาด
      (error) => {
        console.error('Chat error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        setError(`Chat Error: ${errorMessage}`);
        updateLastMessage(`Error: ${errorMessage}`);
        setIsLoading(false);
      }
    );
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Clear conversation
  const handleClearConversation = () => {
    if (confirm('Are you sure you want to clear the conversation?')) {
      clearMessages();
    }
  };

  return (
    <TooltipProvider>
      <div className="flex h-full min-h-0 bg-slate-50 overflow-hidden">
        {/* Left Panel - Controls */}
        <div className="w-[262px] bg-transparent border-r border-slate-200 flex flex-col min-h-0">
          <ScrollArea className="flex-1 min-h-0 p-5 pb-2.5 pl-0 pr-2">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                {/* Instance Selection */}
                <div className="w-full grid gap-1">
                  <div className="text-sm text-slate-700 flex items-center gap-2">
                    Instance
                    {selectedInstance && (
                      <span
                        className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-red-500'}`}
                        title={isHealthy ? 'Online' : 'Offline'}
                      />
                    )}
                  </div>
                  <Select 
                    value={selectedInstance?.id || ''} 
                    onValueChange={(value) => {
                      const instance = userInstances.find(i => i.id === value);
                      setSelectedInstance(instance || null);
                    }}
                  >
                    <SelectTrigger className="w-full bg-white/50">
                      <SelectValue placeholder="Select an instance" />
                    </SelectTrigger>
                    <SelectContent>
                      {userInstances.map((instance) => (
                        <SelectItem key={instance.id} value={instance.id}>
                          {instance.containerName} (:{instance.port})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedInstance && (
                    <p className="text-xs text-slate-500 mt-1">
                      Port: {selectedInstance.port} • {isHealthy ? '✓ Ready' : '✗ Offline'}
                    </p>
                  )}
                </div>

                {/* System Prompt */}
                <div className="model-form">
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="system-prompt" className="text-sm text-slate-700">
                            System Prompt
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info size={12} className="text-slate-400 cursor-help relative top-[-2px]" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs text-xs">Set the behavior and personality of the AI assistant</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                      <Textarea
                        id="system-prompt"
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        className="min-h-[93px] text-sm resize-none bg-white/50"
                        placeholder="Enter system prompt..."
                      />
                    </div>

                    {/* Max Tokens */}
                    <div className="grid gap-2 mb-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="max-tokens" className="text-sm text-slate-700">
                          Max Tokens
                        </Label>
                        <Input
                          id="max-tokens"
                          type="number"
                          value={maxTokens}
                          onChange={(e) => setMaxTokens(Number(e.target.value))}
                          className="w-[90px] h-8 bg-white/50 text-sm"
                          min="1"
                          max="262144"
                        />
                      </div>
                      <Slider
                        value={[maxTokens]}
                        onValueChange={([val]) => setMaxTokens(val)}
                        max={262144}
                        min={1}
                        step={1}
                        className="mt-0 mb-0 h-[28px]"
                      />
                    </div>

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
                              <p className="max-w-xs text-xs">Controls randomness. Lower = focused, Higher = creative</p>
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
                          max="2"
                        />
                      </div>
                      <Slider
                        value={temperature}
                        onValueChange={setTemperature}
                        max={2}
                        step={0.1}
                        className="mt-0 mb-0 h-[28px]"
                      />
                    </div>

                    {/* Top-P */}
                    <div className="grid gap-2 mb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Label className="text-sm text-slate-700">Top-P</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info size={12} className="text-slate-400 cursor-help relative top-[-2px]" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs text-xs">Controls diversity via nucleus sampling</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input
                          type="number"
                          value={topP[0]}
                          onChange={(e) => setTopP([Number(e.target.value)])}
                          className="w-[90px] h-8 bg-white/50 text-sm"
                          step="0.01"
                          min="0.1"
                          max="1"
                        />
                      </div>
                      <Slider
                        value={topP}
                        onValueChange={setTopP}
                        max={1}
                        min={0.1}
                        step={0.01}
                        className="mt-0 mb-0 h-[28px]"
                      />
                    </div>

                    {/* Top-K */}
                    <div className="grid gap-2 mb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Label className="text-sm text-slate-700">Top-K</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info size={12} className="text-slate-400 cursor-help relative top-[-2px]" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs text-xs">Limits the number of tokens to consider</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input
                          type="number"
                          value={topK[0]}
                          onChange={(e) => setTopK([Number(e.target.value)])}
                          className="w-[90px] h-8 bg-white/50 text-sm"
                          step="1"
                          min="0"
                          max="100"
                        />
                      </div>
                      <Slider
                        value={topK}
                        onValueChange={setTopK}
                        max={100}
                        step={1}
                        className="mt-0 mb-0 h-[28px]"
                      />
                    </div>

                    {/* Frequency Penalty */}
                    <div className="grid gap-2 mb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Label className="text-sm text-slate-700">Frequency Penalty</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info size={12} className="text-slate-400 cursor-help relative top-[-2px]" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs text-xs">Penalizes repeated tokens</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input
                          type="number"
                          value={frequencyPenalty[0]}
                          onChange={(e) => setFrequencyPenalty([Number(e.target.value)])}
                          className="w-[90px] h-8 bg-white/50 text-sm"
                          step="0.1"
                          min="-2"
                          max="2"
                        />
                      </div>
                      <Slider
                        value={frequencyPenalty}
                        onValueChange={setFrequencyPenalty}
                        max={2}
                        min={-2}
                        step={0.1}
                        className="mt-0 mb-0 h-[28px]"
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

        {/* Right Panel - Chat Area */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col h-full box-border overflow-hidden">
          {/* Chat Messages Area */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="w-full box-border py-2 pt-0 text-sm flex flex-col px-4">
              {/* Model Badge */}
              <div className="h-[36px] bg-slate-100 rounded-md flex items-center px-3 justify-between mb-4">
                <span className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
                  {selectedInstance?.containerName || 'No instance selected'}
                  {selectedInstance && (
                    <span
                      className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-red-500'}`}
                      title={isHealthy ? 'Online' : 'Offline'}
                    />
                  )}
                </span>
                {selectedInstance && (
                  <span className="text-xs text-slate-500 font-mono">
                    :{selectedInstance.port} • {isHealthy ? '✓ Ready' : '✗ Offline'}
                  </span>
                )}
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Chat Messages */}
              <div className="flex-1 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-64 text-slate-400">
                    <p className="text-sm">Start a conversation...</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-primary text-white'
                            : 'bg-slate-100 text-slate-900'
                        }`}
                      >
                        <div className="text-xs font-medium mb-1 opacity-70">
                          {message.role === 'user' ? 'You' : 'Assistant'}
                        </div>
                        <div className="whitespace-pre-wrap break-words">
                          {message.content}
                        </div>
                        <div className="text-xs mt-1 opacity-50">
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
            </div>
          </ScrollArea>

          {/* Bottom Controls and Input */}
          <div className="flex flex-col px-4 pb-4">
            {/* Clear button */}
            <div className="flex justify-end mb-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={handleClearConversation}
                    disabled={messages.length === 0}
                  >
                    <Trash2 size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Clear conversation</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Input Area */}
            <div className="w-full border bg-white rounded-md p-3 border-slate-200">
              <div className="flex gap-2 items-end">
                <Textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    !selectedInstance
                      ? "Please select an instance first..."
                      : !isHealthy
                      ? "Instance is offline. Check if the container is running..."
                      : "Type your message... (Shift+Enter for new line)"
                  }
                  className="flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[60px] max-h-[200px]"
                  disabled={isLoading || !selectedInstance || !isHealthy}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!prompt.trim() || isLoading || !selectedInstance || !isHealthy}
                  size="icon"
                  className="h-10 w-10 shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </Button>
              </div>
            </div>

            {/* Footer */}
            <div className="text-xs text-slate-400 text-center mt-2">
              AI-generated content may not be accurate.
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
