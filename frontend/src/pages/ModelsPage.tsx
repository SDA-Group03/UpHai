import { useEffect, useState } from 'react';
import { FilterSidebar } from '../components/FilterSidebar';
import { ModelCard } from '../components/ModelCard';
import { ModelDetailsSheet } from '../components/ModelDetailsSheet';
import { Search, XCircle, SlidersHorizontal, Loader2 } from 'lucide-react';
import type { ModelData } from '../lib/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import ax from '@/conf/ax';

function fetchModels(): Promise<ModelData[]> {
  return ax.get<{ success: boolean; data: ModelData[] }>('/models')
    .then(response => {
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error('Failed to fetch models');
      }
    });
}


export const ModelsPage = () => {
  const [models, setModels] = useState<ModelData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const [selectedModel, setSelectedModel] = useState<ModelData | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetchModels()
      .then(data => {
        setModels(data);
      })
      .catch(err => {
        console.error('Error fetching models:', err);
        setError(err.message || 'An unknown error occurred while fetching models.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-[#6E29F6]" />
        <p className="ml-3 text-slate-500">Loading Models...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className={`${isFiltersOpen ? 'w-[260px] opacity-100 mr-3' : 'w-0 opacity-0 mr-0'} hidden lg:block transition-all duration-300 overflow-hidden`}>
        <FilterSidebar />
      </div>
      
      {isFiltersOpen && <Separator orientation="vertical" className="h-full hidden lg:block mr-4" />}

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="mb-6 flex gap-4 items-center">
          <Button 
            variant={isFiltersOpen ? "outline" : "default"}
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className={`flex items-center gap-2 ${isFiltersOpen ? 'text-slate-600 hover:text-[#6E29F6] hover:border-[#6E29F6] hover:bg-purple-50' : 'bg-[#6E29F6] hover:bg-[#5b21cd]'}`}
          >
            <SlidersHorizontal size={16} />
            <span>{isFiltersOpen ? 'Hide Filters' : 'Show Filters'}</span>
          </Button>
          
          <div className="flex-1 max-w-2xl relative group">
            <Input 
              type="text" 
              placeholder="Search models..." 
              className="w-full pl-4 pr-12 h-10 border-slate-200 focus-visible:ring-[#6E29F6] focus-visible:ring-offset-0 shadow-sm group-hover:border-slate-300"
            />
            <XCircle size={16} className="absolute right-12 top-1/2 -translate-y-1/2 text-slate-300 cursor-pointer hover:text-slate-500 transition-colors" />
            <div className="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center border-l border-slate-200 cursor-pointer bg-slate-50 rounded-r-lg hover:bg-slate-100 transition-colors">
              <Search size={16} className="text-slate-500" />
            </div>
          </div>
        </div>

        {error ? (
          <div className="flex-1 flex items-center justify-center text-rose-500 bg-rose-50 rounded-lg">
            <XCircle className="mr-2" />
            <p>Error: {error}</p>
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 pb-10">
              {models.map((model) => (
                <ModelCard key={model.id} data={model} onClick={() => setSelectedModel(model)} />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      <ModelDetailsSheet 
        model={selectedModel} 
        isOpen={!!selectedModel} 
        onClose={() => setSelectedModel(null)} 
      />
    </div>
  );
};
