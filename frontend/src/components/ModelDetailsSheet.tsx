import React from 'react';
import type { ModelData } from '../lib/types';
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

interface ModelDetailsSheetProps {
  model: ModelData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ModelDetailsSheet = ({ model, isOpen, onClose }: ModelDetailsSheetProps) => {
  return (
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

              <div className="pt-6 mt-auto">
                <Button className="w-full bg-[#6E29F6] hover:bg-[#5b21cd] h-11 text-base shadow-lg shadow-purple-900/10">
                  Deploy Model
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};