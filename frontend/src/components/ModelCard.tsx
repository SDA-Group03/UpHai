import React from 'react';
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
          <img src={data.iconUrl} alt={data.provider} className="w-full h-full object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-base font-bold truncate ${data.isDeprecated ? 'line-through text-slate-400' : 'text-slate-800 group-hover:text-[#6E29F6] transition-colors'}`}>
            {data.name}
          </h3>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <span className="truncate max-w-[80px]">{data.provider}</span>
            <span className="w-px h-3 bg-slate-300"></span>
            <div className="flex items-center">
              <span className="mr-0.5 text-slate-400">$</span>
              <span className="font-bold text-slate-700">{data.price}</span>
              <span className="ml-1 text-slate-400">/ 1M Tokens</span>
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Description */}
      <CardContent className="p-5 pt-2 flex-1">
        <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">
          {data.isDeprecated && <Badge variant="destructive" className="mr-1 text-[10px] px-1.5 py-0 h-5 uppercase">Deprecated</Badge>}
          {data.description}
        </p>
      </CardContent>

      {/* Footer Tags */}
      <CardFooter className="p-5 pt-0 flex flex-wrap gap-2 mt-auto">
        <Badge variant="secondary" className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-100">Chat</Badge>
        {data.tags.map((tag) => (
          <Badge key={tag} variant="outline" className="bg-slate-50 text-slate-600 border-slate-100 group-hover:bg-[#6E29F6]/5 group-hover:text-[#6E29F6] group-hover:border-[#6E29F6]/20 transition-colors">
            {tag}
          </Badge>
        ))}
      </CardFooter>
    </Card>
  );
};