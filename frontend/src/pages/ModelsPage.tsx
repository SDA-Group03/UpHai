import React, { useState } from 'react';
import { FilterSidebar } from '../components/FilterSidebar';
import { ModelCard } from '../components/ModelCard';
import { ModelDetailsSheet } from '../components/ModelDetailsSheet';
import { Search, XCircle, SlidersHorizontal } from 'lucide-react';
import type { ModelData } from '../types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
//Mock Data
const models: ModelData[] = [
  {
    id: '1',
    name: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
    provider: 'meta-llama',
    price: '0.06',
    description: 'Meta Llama 3.1 is a family of multilingual large language models developed by Meta.',
    tags: ['Prefix', '8B', '33K'],
    iconUrl: 'https://sf-maas.s3.us-east-1.amazonaws.com/Model_LOGO/Meta.svg'
  },
  {
    id: '2',
    name: 'meta-llama/Llama-3.3-70B-Instruct',
    provider: 'meta-llama',
    price: '0.59',
    description: 'Llama 3.3 is the most advanced multilingual open-source large language model in the Llama series.',
    tags: ['Tools', '70B', '32K'],
    iconUrl: 'https://sf-maas.s3.us-east-1.amazonaws.com/Model_LOGO/Meta.svg',
    isDeprecated: true
  },
  {
    id: '3',
    name: 'Qwen/Qwen2.5-72B-Instruct',
    provider: 'Qwen',
    price: '0.42',
    description: 'Qwen2.5-72B-Instruct is one of the latest large language model series released by Alibaba Cloud.',
    tags: ['Tools', '72B', '32K'],
    iconUrl: 'https://sf-maas.s3.us-east-1.amazonaws.com/Model_LOGO/Tongyi.png'
  },
  {
    id: '4',
    name: 'deepseek-ai/DeepSeek-V3',
    provider: 'deepseek-ai',
    price: '0.14',
    description: 'DeepSeek-V3 demonstrates notable improvements over its predecessor.',
    tags: ['MoE', 'Reasoning', '671B'],
    iconUrl: 'https://sf-maas.s3.us-east-1.amazonaws.com/Model_LOGO/DeepSeek.svg'
  }
];

export const ModelsPage = () => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const [selectedModel, setSelectedModel] = useState<ModelData | null>(null);

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

        <ScrollArea className="flex-1 pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 pb-10">
            {models.map((model) => (
              <ModelCard key={model.id} data={model} onClick={() => setSelectedModel(model)} />
            ))}
            {models.map((model) => (
              <ModelCard key={`dup-${model.id}`} data={{...model, id: `dup-${model.id}`}} onClick={() => setSelectedModel(model)} />
            ))}
          </div>
        </ScrollArea>
      </div>

      <ModelDetailsSheet 
        model={selectedModel} 
        isOpen={!!selectedModel} 
        onClose={() => setSelectedModel(null)} 
      />
    </div>
  );
};