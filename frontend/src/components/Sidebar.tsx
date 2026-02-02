import React from 'react';
import { Box, Image, MessageSquare, Mic, Settings, Wallet, FileText, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const MenuItem = ({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) => (
  <Button variant="ghost" className={`w-full justify-start gap-3 mb-1 px-4 ${active ? 'bg-[#6E29F6] text-white hover:bg-[#5b21cd] hover:text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}>
    <Icon size={16} />
    <span className="text-sm font-medium">{label}</span>
  </Button>
);

const MenuGroup = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="mb-4 px-3">
    <div className="px-4 py-2 text-xs text-slate-500 font-bold uppercase tracking-wider">{title}</div>
    <div className="flex flex-col gap-1">{children}</div>
  </div>
);

interface SidebarProps {
  isOpen: boolean;
}

export const Sidebar = ({ isOpen }: SidebarProps) => {
  return (
    <aside className={`${isOpen ? 'w-[200px] translate-x-0' : 'w-0 -translate-x-full opacity-0'} bg-[#001529] h-screen flex flex-col flex-shrink-0 z-50 text-white transition-all duration-300 overflow-hidden whitespace-nowrap`}>
      {/* Logo Area */}
      <div className="h-14 flex items-center justify-center bg-[#6E29F6]">
        <span className="text-xl font-bold tracking-wide">UpHai</span>
      </div>

      {/* Menu Area */}
      <ScrollArea className="flex-1 py-4">
        <MenuGroup title="Models">
          <MenuItem icon={Box} label="Models" active />
        </MenuGroup>

        <MenuGroup title="Playground">
          <MenuItem icon={MessageSquare} label="Chat" />
          <MenuItem icon={Image} label="Image" />
          <MenuItem icon={Mic} label="Audio" />
        </MenuGroup>

        <MenuGroup title="Settings">
          <MenuItem icon={Settings} label="API Keys" />
        </MenuGroup>
      </ScrollArea>

      {/* Footer Docs */}
      <div className="p-4 bg-white/5 backdrop-blur-sm">
        <Button variant="ghost" className="w-full justify-between text-slate-400 hover:text-white hover:bg-white/5">
          <FileText size={16} />
          <span>Docs</span>
          <ChevronRight size={14} className="ml-auto" />
        </Button>
      </div>
    </aside>
  );
};