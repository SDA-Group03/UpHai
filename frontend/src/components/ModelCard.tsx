import type { ModelData } from '../lib/types';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ModelCardProps {
  data: ModelData;
  onClick?: () => void;
}

export const ModelCard = ({ data, onClick }: ModelCardProps) => {
  return (
    <Card onClick={onClick} className="group relative flex flex-col justify-between border-slate-100 shadow-sm hover:shadow-xl hover:border-purple-500/30 transition-all duration-300 cursor-pointer h-full hover:-translate-y-1 overflow-hidden">
      {/* Header */}
      <CardHeader className="p-5 pb-2 flex flex-row gap-3 space-y-0">
        <div className="w-12 h-12 flex-shrink-0 p-1 bg-slate-50 rounded-lg border border-slate-100">
          <img src={data.iconUrl ?? ''} alt={data.series ?? ''} className="w-full h-full object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold truncate text-slate-800 group-hover:text-[#6E29F6] transition-colors">
            {data.displayName}
          </h3>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <span className="truncate">{data.series}</span>
            {data.sizeMb > 0 && (
              <>
                <span className="w-px h-3 bg-slate-300" />
                <span className="font-medium text-slate-700">{data.sizeMb} MB</span>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Description */}
      <CardContent className="p-5 pt-2 flex-1">
        <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">
          {data.description}
        </p>
      </CardContent>

      {/* Footer Tags */}
      <CardFooter className="p-5 pt-0 flex flex-wrap gap-2 mt-auto">
        <Badge variant="secondary" className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-100">{data.category}</Badge>
        {data.performanceTier && (
          <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-100 group-hover:bg-[#6E29F6]/5 group-hover:text-[#6E29F6] group-hover:border-[#6E29F6]/20 transition-colors">
            {data.performanceTier}
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
};