import { useState } from 'react';
import type { ModelData, ResourceConfig } from '../lib/types';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Settings } from 'lucide-react';
import { ResourceConfigSheet } from './ResourceConfigSheet';
import { deployModel } from '@/services/dockerService';
import { fetchProfile } from '@/services/authService';

interface ModelDetailsSheetProps {
  model: ModelData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ModelDetailsSheet = ({ model, isOpen, onClose }: ModelDetailsSheetProps) => {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStatus, setDeployStatus] = useState<string | null>(null);
  const [showResourceConfig, setShowResourceConfig] = useState(false);

  const handleDeployWithConfig = async (config: ResourceConfig) => {
    if (!model) return;

    setIsDeploying(true);
    setDeployStatus('Deploying...');
    setShowResourceConfig(false);

    try {
      const user = await fetchProfile();
      if (!user) {
        setDeployStatus('You must be logged in to deploy a model.');
        setIsDeploying(false);
        return;
      }
      
      const payload = {
        userId: String(user.id),
        engine: model.engine,
        modelName: model.name,
        containerName: config.containerName,
        resourceConfig: {
          memoryMb: config.memoryMb,
          cpuCores: config.cpuCores,
          autoStopMinutes: config.autoStopMinutes,
        },
      };
      const result = await deployModel(payload);
      console.log('Deployment result:', result);
      setDeployStatus('Deployed successfully!');
    } catch (error: any) {
      console.error('Deployment failed:', error);
      setDeployStatus(error.message || 'Deployment failed.');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleQuickDeploy = () => {
    if (!model) return;
    handleDeployWithConfig({
      memoryMb: model.recMemoryMb,
      cpuCores: model.recCpuCores,
      autoStopMinutes: 30,
    });
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          {model && (
            <>
              <SheetHeader className="mb-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 p-2 bg-slate-50 rounded-xl border border-slate-100 shrink-0">
                    <img src={model.iconUrl ?? ''} alt={model.series ?? ''} className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <SheetTitle className="text-xl font-bold text-slate-900">{model.displayName}</SheetTitle>
                    <SheetDescription className="flex items-center gap-2 mt-1.5">
                      <span className="font-medium text-slate-900">{model.series}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="font-medium text-slate-500">{model.engine}</span>
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">Description</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {model.description}
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">Details</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100">{model.category}</Badge>
                    {model.performanceTier && (
                      <Badge variant="outline" className="text-slate-600">{model.performanceTier}</Badge>
                    )}
                    {model.sizeMb > 0 && (
                       <Badge variant="outline" className="text-slate-600">{model.sizeMb} MB</Badge>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Resource Requirements */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">Resource Requirements</h4>
                  <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Min Memory:</span>
                      <span className="font-medium">{model.minMemoryMb} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Recommended Memory:</span>
                      <span className="font-medium text-[#6E29F6]">{model.recMemoryMb} MB</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between">
                      <span className="text-slate-600">Min CPU:</span>
                      <span className="font-medium">{model.minCpuCores} vCPU</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Recommended CPU:</span>
                      <span className="font-medium text-[#6E29F6]">{model.recCpuCores} vCPU </span>
                    </div>
                  </div>
                </div>

                {/* Deploy Buttons */}
                <div className="pt-6 mt-auto space-y-3">
                  <Button 
                    className="w-full bg-[#6E29F6] hover:bg-[#5b21cd] h-11 text-base shadow-lg shadow-purple-900/10"
                    onClick={handleQuickDeploy}
                    disabled={isDeploying}
                  >
                    {isDeploying ? deployStatus : 'Deploy with Recommended Settings'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full h-11 text-base border-[#6E29F6] text-[#6E29F6] hover:bg-purple-50"
                    onClick={() => setShowResourceConfig(true)}
                    disabled={isDeploying}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configure Resources
                  </Button>

                  {deployStatus && !isDeploying && (
                    <p className="text-sm text-center mt-2">{deployStatus}</p>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Resource Configuration Sheet */}
      {model && (
        <ResourceConfigSheet
          model={model}
          isOpen={showResourceConfig}
          onClose={() => setShowResourceConfig(false)}
          onDeploy={handleDeployWithConfig}
        />
      )}
    </>
  );
};
