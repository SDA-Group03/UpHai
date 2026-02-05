import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FilterGroupProps {
  value: string;
  title: string;
  options: string[];
}

const FilterGroup = ({ value, title, options }: FilterGroupProps) => {
  return (
    <AccordionItem value={value} className="border-b-0 mb-4">
      <AccordionTrigger className="py-2 hover:no-underline text-xs text-slate-500 font-bold uppercase tracking-wide hover:text-slate-700">
        {title}
      </AccordionTrigger>
      <AccordionContent>
        <div className="grid grid-cols-2 gap-2">
          {options.map((opt) => (
            <Button
              key={opt}
              variant="outline"
              className="h-8 px-2 text-xs font-medium text-slate-600 hover:border-[#6E29F6] hover:text-[#6E29F6] hover:bg-purple-50 bg-white truncate shadow-sm justify-center"
              title={opt}
            >
              {opt}
            </Button>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export const FilterSidebar = () => {
  return (
    <ScrollArea className="h-full pr-4 pb-20 w-full">
      <Accordion type="multiple" defaultValue={["category", "tags", "series", "context", "size"]} className="w-full">
        <FilterGroup
          value="category"
          title="Category"
          options={["Chat", "Image", "Video", "Speech", "Embedding", "Reranker"]}
        />
        <FilterGroup value="tags" title="Tags" options={["VLM", "MoE", "Tools", "FIM", "Math", "Coder"]} />
        <FilterGroup
          value="series"
          title="Series"
          options={["DeepSeek", "Qwen", "Llama", "FLUX", "MiniMax", "Mistral"]}
        />
        <FilterGroup value="context" title="Context Window" options={["≥ 8K", "≥ 16K", "≥ 32K", "≥ 128K"]} />
        <FilterGroup value="size" title="Model Size" options={["Under 10B", "10 ~ 50B", "50 ~ 100B", "Over 100B"]} />
      </Accordion>
    </ScrollArea>
  );
};
