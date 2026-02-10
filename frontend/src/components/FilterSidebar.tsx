import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface ModelsFilters {
  category: string | null;
  series: string | null;
  performanceTier: string | null;
}

interface FilterGroupProps {
  value: string;
  title: string;
  options: string[];
  activeValue: string | null;
  onSelect: (value: string | null) => void;
}

const FilterGroup = ({ value, title, options, activeValue, onSelect }: FilterGroupProps) => {
  return (
    <AccordionItem value={value} className="border-b-0 mb-4">
      <AccordionTrigger className="py-2 hover:no-underline text-xs text-slate-500 font-bold uppercase tracking-wide hover:text-slate-700">
        {title}
      </AccordionTrigger>
      <AccordionContent>
        {options.length === 0 ? (
          <div className="text-sm text-slate-400">No options</div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {options.map((opt) => {
              const isActive = opt === activeValue;
              return (
                <Button
                  key={opt}
                  type="button"
                  variant="outline"
                  onClick={() => onSelect(isActive ? null : opt)}
                  className={cn(
                    "h-8 px-2 text-xs font-medium bg-white truncate shadow-sm justify-center",
                    isActive
                      ? "border-[#6E29F6] text-[#6E29F6] bg-purple-50 hover:bg-purple-50 hover:border-[#6E29F6] hover:text-[#6E29F6]"
                      : "text-slate-600 hover:border-[#6E29F6] hover:text-[#6E29F6] hover:bg-purple-50"
                  )}
                  title={opt}
                >
                  {opt}
                </Button>
              );
            })}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
};

interface FilterSidebarProps {
  options: {
    categories: string[];
    series: string[];
    performanceTiers: string[];
  };
  value: ModelsFilters;
  onChange: (next: ModelsFilters) => void;
  onClear?: () => void;
}

export const FilterSidebar = ({ options, value, onChange, onClear }: FilterSidebarProps) => {
  const hasAnyFilter = value.category !== null || value.series !== null || value.performanceTier !== null;

  return (
    <ScrollArea className="h-full pr-4 pb-20 w-full">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Filters</p>
        {onClear && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!hasAnyFilter}
            onClick={onClear}
            className="h-8 px-2 text-xs text-slate-600 hover:text-[#6E29F6]"
          >
            Clear
          </Button>
        )}
      </div>

      <Accordion type="multiple" defaultValue={["category", "series", "performance"]} className="w-full">
        <FilterGroup
          value="category"
          title="Category"
          options={options.categories}
          activeValue={value.category}
          onSelect={(next) => onChange({ ...value, category: next })}
        />
        <FilterGroup
          value="series"
          title="Series"
          options={options.series}
          activeValue={value.series}
          onSelect={(next) => onChange({ ...value, series: next })}
        />
        <FilterGroup
          value="performance"
          title="Performance"
          options={options.performanceTiers}
          activeValue={value.performanceTier}
          onSelect={(next) => onChange({ ...value, performanceTier: next })}
        />
      </Accordion>
    </ScrollArea>
  );
};
