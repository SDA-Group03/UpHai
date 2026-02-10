import { useEffect, useMemo, useState } from 'react';
import { FilterSidebar, type ModelsFilters } from '../components/FilterSidebar';
import { ModelCard } from '../components/ModelCard';
import { ModelDetailsSheet } from '../components/ModelDetailsSheet';
import { Search, XCircle, SlidersHorizontal, Loader2 } from 'lucide-react';
import type { ModelData } from '../lib/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<ModelsFilters>({
    category: null,
    series: null,
    performanceTier: null,
  });

  const filterOptions = useMemo(() => {
    const unique = (items: Array<string | null | undefined>) =>
      Array.from(
        new Set(
          items
            .map((v) => v?.trim())
            .filter((v): v is string => Boolean(v && v.length > 0))
        )
      ).sort((a, b) => a.localeCompare(b));

    return {
      categories: unique(models.map((m) => m.category)),
      series: unique(models.map((m) => m.series)),
      performanceTiers: unique(models.map((m) => m.performanceTier)),
    };
  }, [models]);

  const filteredModels = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();

    return models.filter((model) => {
      if (filters.category && model.category !== filters.category) return false;
      if (filters.series && model.series !== filters.series) return false;
      if (filters.performanceTier && model.performanceTier !== filters.performanceTier) return false;
      if (!normalized) return true;

      const haystack = [
        model.name,
        model.displayName,
        model.description ?? "",
        model.category,
        model.series ?? "",
        model.performanceTier ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [filters, models, searchTerm]);

  const clearAllFilters = () => {
    setFilters({ category: null, series: null, performanceTier: null });
  };

  const clearAll = () => {
    setSearchTerm("");
    clearAllFilters();
  };

  const hasAnyActiveFilters =
    searchTerm.trim().length > 0 ||
    filters.category !== null ||
    filters.series !== null ||
    filters.performanceTier !== null;

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
        <FilterSidebar options={filterOptions} value={filters} onChange={setFilters} onClear={clearAllFilters} />
      </div>
      
      {isFiltersOpen && <Separator orientation="vertical" className="h-full hidden lg:block mr-4" />}

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="mb-6 flex gap-4 items-center">
          <div className="hidden lg:block">
            <Button
              variant={isFiltersOpen ? "outline" : "default"}
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className={`flex items-center gap-2 ${isFiltersOpen ? 'text-slate-600 hover:text-[#6E29F6] hover:border-[#6E29F6] hover:bg-purple-50' : 'bg-[#6E29F6] hover:bg-[#5b21cd]'}`}
            >
              <SlidersHorizontal size={16} />
              <span>{isFiltersOpen ? 'Hide Filters' : 'Show Filters'}</span>
            </Button>
          </div>

          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 text-slate-600 hover:text-[#6E29F6] hover:border-[#6E29F6] hover:bg-purple-50"
                >
                  <SlidersHorizontal size={16} />
                  <span>Filters</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0">
                <div className="h-full pt-12 px-6">
                  <FilterSidebar options={filterOptions} value={filters} onChange={setFilters} onClear={clearAllFilters} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          <div className="flex-1 max-w-2xl relative group">
            <Input 
              type="text" 
              placeholder="Search models..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-12 h-10 border-slate-200 focus-visible:ring-[#6E29F6] focus-visible:ring-offset-0 shadow-sm group-hover:border-slate-300"
            />
            {searchTerm.trim().length > 0 && (
              <XCircle
                size={16}
                className="absolute right-12 top-1/2 -translate-y-1/2 text-slate-300 cursor-pointer hover:text-slate-500 transition-colors"
                onClick={() => setSearchTerm("")}
              />
            )}
            <div className="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center border-l border-slate-200 cursor-pointer bg-slate-50 rounded-r-lg hover:bg-slate-100 transition-colors">
              <Search size={16} className="text-slate-500" />
            </div>
          </div>
        </div>

        {hasAnyActiveFilters && (
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500">Active:</span>

              {searchTerm.trim().length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">
                  Search: "{searchTerm.trim()}"
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label="Clear search"
                  >
                    <XCircle size={14} />
                  </button>
                </span>
              )}

              {filters.category && (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">
                  Category: {filters.category}
                  <button
                    type="button"
                    onClick={() => setFilters((prev) => ({ ...prev, category: null }))}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label="Clear category filter"
                  >
                    <XCircle size={14} />
                  </button>
                </span>
              )}

              {filters.series && (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">
                  Series: {filters.series}
                  <button
                    type="button"
                    onClick={() => setFilters((prev) => ({ ...prev, series: null }))}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label="Clear series filter"
                  >
                    <XCircle size={14} />
                  </button>
                </span>
              )}

              {filters.performanceTier && (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">
                  Performance: {filters.performanceTier}
                  <button
                    type="button"
                    onClick={() => setFilters((prev) => ({ ...prev, performanceTier: null }))}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label="Clear performance filter"
                  >
                    <XCircle size={14} />
                  </button>
                </span>
              )}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-7 px-2 text-xs text-slate-600 hover:text-[#6E29F6]"
              >
                Clear all
              </Button>
            </div>

            <div className="text-xs text-slate-500">
              Showing {filteredModels.length} of {models.length}
            </div>
          </div>
        )}

        {error ? (
          <div className="flex-1 flex items-center justify-center text-rose-500 bg-rose-50 rounded-lg">
            <XCircle className="mr-2" />
            <p>Error: {error}</p>
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4">
            {filteredModels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <div>No models found matching your criteria.</div>
                {hasAnyActiveFilters && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearAll}
                    className="mt-4 hover:border-[#6E29F6] hover:text-[#6E29F6] hover:bg-purple-50"
                  >
                    Clear search & filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 pb-10">
                {filteredModels.map((model) => (
                  <ModelCard key={model.id} data={model} onClick={() => setSelectedModel(model)} />
                ))}
              </div>
            )}
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
