import React, { useState, useEffect } from 'react';
import { Info, ImagePlus, Send, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getUserInstances } from '@/services/dockerService';
import { fetchProfile } from '@/services/authService';

interface UserInstance {
  id: string;
  modelName: string;
  port: number;
  [key: string]: any;
}

export default function ChatPlayground() {
  const [model, setModel] = useState('');
  const [userModels, setUserModels] = useState<UserInstance[]>([]);
  const [systemPrompt, setSystemPrompt] = useState('You are Kimi, an AI assistant created by Moonshot AI.');
  const [maxTokens, setMaxTokens] = useState(8192);
  const [temperature, setTemperature] = useState([1.0]);
  const [topP, setTopP] = useState([0.95]);
  const [topK, setTopK] = useState([50]);
  const [frequencyPenalty, setFrequencyPenalty] = useState([0.0]);

  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    const fetchUserModels = async () => {
      try {
        const user = await fetchProfile();
        if (user) {
          console.log("Fetching models for user:", user);
          const response = await getUserInstances(user.id.toString());
          if (response.success) {
            console.log("Fetched user models:", response.data);
            setUserModels(response.data);
            if (response.data.length > 0) {
              const firstModel = response.data[0];
              setModel(firstModel.containerName);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch user models:", error);
      }
    };

    fetchUserModels();
  }, []);

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-slate-50">
      {/* Left Panel - Controls */}
      <div className="max-w-[262px] min-w-[262px] bg-transparent border-r border-slate-200 flex flex-col">
        <ScrollArea className="flex-1 p-5 pb-2.5 pl-0 pr-2 overflow-y-auto overflow-x-hidden">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              {/* Model Selection */}
              <div className="w-full grid gap-1">
                <div className="text-sm text-slate-700">Model</div>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="w-full bg-white/50">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {userModels.map((userModel) => (
                      <SelectItem key={userModel.id} value={userModel.containerName}>
                        {userModel.containerName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                      <div className="flex items-center gap-1">
                        <Label htmlFor="max-tokens" className="text-sm text-slate-700 max-w-[120px] truncate">
                          Max Tokens
                        </Label>
                      </div>
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
                        <Label className="text-sm text-slate-700 max-w-[120px] truncate">Temperature</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info size={12} className="text-slate-400 cursor-help relative top-[-2px]" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs text-xs">Controls randomness. Lower values are more focused and deterministic.</p>
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
                        <Label className="text-sm text-slate-700 max-w-[120px] truncate">Top-P</Label>
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
                        <Label className="text-sm text-slate-700 max-w-[120px] truncate">Top-K</Label>
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
                        <Label className="text-sm text-slate-700 max-w-[120px] truncate">Frequency Penalty</Label>
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
      <div className="flex-1 flex flex-col h-full box-border overflow-hidden">
        {/* Chat Messages Area */}
        <ScrollArea className="flex-1 overflow-y-auto no-scrollbar">
          <div className="full box-border py-2 pt-0 text-sm flex flex-col">
            {/* Model Badge */}
            <div className="h-[36px] bg-slate-100 rounded-md flex items-center px-3 justify-between">
              <span className="overflow-hidden text-ellipsis whitespace-nowrap">{model}</span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto mt-2 p-3 space-y-3">
              {/* Empty state - messages will go here */}
              <div className="flex items-center justify-center h-64 text-slate-400">
                <p className="text-sm">Start a conversation...</p>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Bottom Controls and Input */}
        <div className="flex flex-col">
          {/* Clear button */}
          <div className="flex px-1">
            <div className="flex-1"></div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="ml-2 min-w-[32px] h-8 w-8">
                  <Trash2 size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Clear conversation</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Input Area */}
          <div className="w-full border bg-white/50 rounded-md p-1 pr-3 transition-all duration-300 flex flex-col border-slate-200 mt-2">
            <div className="w-full h-[112px] flex justify-between items-center bg-transparent">
              <div className="flex-1 h-full bg-transparent">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter your prompt... (paste to upload images, delete to remove images)"
                  className="h-full resize-none no-scrollbar border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <div className="flex gap-1">
                <div className="w-[40px] h-[40px] rounded bg-primary flex items-center justify-center cursor-pointer hover:opacity-90 transition">
                  <ImagePlus size={18} className="text-white -rotate-90" />
                </div>
                <div className={`w-[40px] h-[40px] rounded bg-primary flex items-center justify-center ${prompt.trim() ? 'cursor-pointer hover:opacity-90' : 'opacity-50 cursor-not-allowed'} transition`}>
                  <Send size={18} className="text-white -rotate-90" />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-xs text-slate-400 text-center mt-2 pb-2">
            AI-generated content, accuracy not guaranteed. Please follow the{' '}
            <a href="" className="text-primary hover:underline underline-offset-2">
              Terms of Service
            </a>
            {' '}and applicable laws.
          </div>
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
};