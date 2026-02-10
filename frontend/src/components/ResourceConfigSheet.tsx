import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Zap } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ModelData, ResourceConfig } from '../lib/types';

interface ResourceConfigSheetProps {
  model: ModelData;
  isOpen: boolean;
  onClose: () => void;
  onDeploy: (config: ResourceConfig) => void;
}

const MEMORY_OPTIONS = [512, 768, 1024, 1536, 2048, 3072, 4096, 6144, 8192]; 
const CPU_OPTIONS = [0.5, 1, 1.5, 2,2.5,3,3.5, 4]; 

export const ResourceConfigSheet = ({ model, isOpen, onClose, onDeploy }: ResourceConfigSheetProps) => {
  const [memoryMb, setMemoryMb] = useState(model.recMemoryMb);
  const [cpuCores, setCpuCores] = useState(model.recCpuCores);
  const [autoStopMinutes, setAutoStopMinutes] = useState<number | null>(30);
  const [containerName, setContainerName] = useState<string>("");

  const handleDeploy = () => {
    onDeploy({
      memoryMb,
      cpuCores,
      autoStopMinutes,
      containerName: containerName.trim() ? containerName.trim() : undefined,
    });
  };

  const getMemoryIndex = (value: number) => {
    const index = MEMORY_OPTIONS.indexOf(value);
    return index === -1 ? MEMORY_OPTIONS.indexOf(model.recMemoryMb) : index;
  };

  const getCpuIndex = (value: number) => {
    const index = CPU_OPTIONS.indexOf(value);
    return index === -1 ? CPU_OPTIONS.indexOf(model.recCpuCores) : index;
  };

  const isMemoryBelowMin = memoryMb < model.minMemoryMb;
  const isMemoryBelowRec = memoryMb < model.recMemoryMb;
  const isCpuBelowMin = cpuCores < model.minCpuCores;
  const isCpuBelowRec = cpuCores < model.recCpuCores;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="left" className="w-[400px] sm:w-[480px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl font-bold">Configure Resources</SheetTitle>
          <SheetDescription>
            Adjust CPU and memory allocation for {model.displayName}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Container Name */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Container Name (optional)</Label>
            <Input
              value={containerName}
              onChange={(e) => setContainerName(e.target.value)}
              placeholder={`e.g. ${model.engine}-${model.name.replace(/[^A-Za-z0-9_.-]+/g, '-')}`}
              className="h-10"
            />
            <p className="text-xs text-slate-500">
              Allowed characters: letters, numbers, <span className="font-mono">.</span>{" "}
              <span className="font-mono">_</span>{" "}
              <span className="font-mono">-</span>. Must start with a letter or number.
            </p>
          </div>

          <Separator />

          {/* Memory Configuration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Memory Allocation</Label>
              <div className="flex items-center gap-2">
                <Input 
                  type="number" 
                  value={memoryMb}
                  onChange={(e) => setMemoryMb(Number(e.target.value))}
                  className="w-20 h-8 text-right"
                />
                <span className="text-sm text-slate-500">MB</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMemoryMb(model.recMemoryMb)}
                  className="h-8 px-2"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Recommended
                </Button>
              </div>
            </div>

            <Slider
              value={[getMemoryIndex(memoryMb)]}
              onValueChange={([index]) => setMemoryMb(MEMORY_OPTIONS[index])}
              max={MEMORY_OPTIONS.length - 1}
              step={1}
              className="py-4"
            />

            <div className="flex justify-between text-xs text-slate-500">
              <span>Min ({model.minMemoryMb} MB)</span>
              <span className="text-[#6E29F6] font-medium">Rec ({model.recMemoryMb} MB)</span>
              <span>Max ({MEMORY_OPTIONS[MEMORY_OPTIONS.length - 1]} MB)</span>
            </div>

            {isMemoryBelowMin && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Setting below minimum may cause OOM errors
                </AlertDescription>
              </Alert>
            )}

            {!isMemoryBelowMin && isMemoryBelowRec && (
              <Alert className="py-2 border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-xs text-amber-800">
                  Inference may be slow with less than recommended memory
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Separator />

          {/* CPU Configuration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">CPU Allocation</Label>
              <div className="flex items-center gap-2">
                <Input 
                  type="number" 
                  value={cpuCores}
                  onChange={(e) => setCpuCores(Number(e.target.value))}
                  step="0.5"
                  className="w-20 h-8 text-right"
                />
                <span className="text-sm text-slate-500">vCPU</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCpuCores(model.recCpuCores)}
                    className="h-8 px-2"
                  >
                  <Zap className="h-3 w-3 mr-1" />
                  Recommended
                </Button>
              </div>
            </div>

            <Slider
              value={[getCpuIndex(cpuCores)]}
              onValueChange={([index]) => setCpuCores(CPU_OPTIONS[index])}
              max={CPU_OPTIONS.length - 1}
              step={1}
              className="py-4"
            />

            <div className="flex justify-between text-xs text-slate-500">
              <span>Min ({model.minCpuCores} vCPU)</span>
              <span className="text-[#6E29F6] font-medium">Rec ({model.recCpuCores} vCPU)</span>
              <span>Max ({CPU_OPTIONS[CPU_OPTIONS.length - 1]} vCPU)</span>
            </div>

            {isCpuBelowMin && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Setting below minimum may cause OOM errors
                </AlertDescription>
              </Alert>
            )}

            {!isCpuBelowMin && isCpuBelowRec && (
              <Alert className="py-2 border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-xs text-amber-800">
                  Inference may be slow with less than recommended CPU
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Separator />

          {/* Auto-stop Configuration */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Auto-stop</Label>
            <Select
              value={autoStopMinutes === null ? "never" : String(autoStopMinutes)}
              onValueChange={(value) => setAutoStopMinutes(value === "never" ? null : Number(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never</SelectItem>
                <SelectItem value="15">After 15 minutes</SelectItem>
                <SelectItem value="30">After 30 minutes</SelectItem>
                <SelectItem value="60">After 1 hour</SelectItem>
                <SelectItem value="120">After 2 hours</SelectItem>
                <SelectItem value="240">After 4 hours</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              Automatically stop the instance after period of inactivity
            </p>
          </div>

          {/* Deploy Button */}
          <div className="pt-4">
            <Button
              className="w-full bg-[#6E29F6] hover:bg-[#5b21cd] h-11 text-base"
              onClick={handleDeploy}
            >
              Deploy
            </Button>
          </div>

          {/* Resource Summary */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Memory:</span>
              <span className="font-medium">{memoryMb} MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">CPU:</span>
              <span className="font-medium">{cpuCores} vCPU</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Container:</span>
              <span className="font-medium">{containerName.trim() ? containerName.trim() : "Auto"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Auto-stop:</span>
              <span className="font-medium">
                {autoStopMinutes === null ? "Never" : `${autoStopMinutes} min`}
              </span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
