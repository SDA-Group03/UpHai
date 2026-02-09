import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Box, MessageSquare, Image, Mic, Key, FileText, ExternalLink, ScanEye, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const MenuItem = ({
  icon: Icon,
  label,
  to,
  active = false,
}: {
  icon: any;
  label: string;
  to: string;
  active?: boolean;
}) => (
  <Link to={to}>
    <Button
      variant="ghost"
      className={`w-full justify-start gap-3 h-9 px-3 rounded-md ${
        active
          ? "bg-[#7C3AED] text-white hover:bg-[#6D28D9] hover:text-white"
          : "text-slate-300 hover:text-white hover:bg-slate-700/50"
      }`}
    >
      <Icon size={18} />
      <span className="text-sm">{label}</span>
    </Button>
  </Link>
);

const MenuGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-6">
    <div className="px-3 mb-2 text-xs text-slate-500 font-medium tracking-wide">{title}</div>
    <div className="flex flex-col gap-0.5">{children}</div>
  </div>
);

interface SidebarProps {
  isOpen: boolean;
}

export const Sidebar = ({ isOpen }: SidebarProps) => {
  const location = useLocation();

  return (
    <aside
      className={`${
        isOpen ? "w-[200px] translate-x-0" : "w-0 -translate-x-full opacity-0"
      } bg-[#1E1E2E] h-screen flex flex-col flex-shrink-0 z-50 text-white transition-all duration-300 overflow-hidden whitespace-nowrap border-r border-slate-800`}
    >
      {/* Logo Area */}
      <div className="h-14 flex items-center px-4 border-b border-slate-800">
        <div className="flex items-center  gap-2">
          <div className="w-6 h-6 rounded i bg-gradient-to-br from-purple-500 to-indigo-600" />
          <span className="text-base font-semibold">UpHai</span>
        </div>
      </div>

      {/* Menu Area */}
      <ScrollArea className="flex-1 py-4 px-2">
        <MenuGroup title="Dashboard">
          <MenuItem
            icon={LayoutDashboard}
            label="Instances"
            to="/dashboard/deployed"
            active={location.pathname === "/dashboard/deployed"}
          ></MenuItem>
        </MenuGroup>
        <MenuGroup title="Models">
          <MenuItem icon={Box} label="Models" to="/models" active={location.pathname === "/models"} />
        </MenuGroup>

        <MenuGroup title="Playground">
          <MenuItem
            icon={MessageSquare}
            label="Chat"
            to="/playground/chat"
            active={location.pathname === "/playground/chat"}
          />
          
          <MenuItem
            icon={ScanEye}
            label="Vision"
            to="/playground/vision"
            active={location.pathname === "/playground/vision"}
          />
          <MenuItem
            icon={Mic}
            label="Audio"
            to="/playground/audio"
            active={location.pathname === "/playground/audio"}
          />
        </MenuGroup>

        <MenuGroup title="Settings">
          <MenuItem
            icon={Key}
            label="API Keys"
            to="/settings/api-keys"
            active={location.pathname === "/settings/api-keys"}
          />
        </MenuGroup>
      </ScrollArea>

      {/* Footer Docs */}
      <div className="p-3 border-t border-slate-800">
        <a href="" target="_blank" rel="noopener noreferrer" className="w-full">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-9 px-3 text-slate-300 hover:text-white hover:bg-slate-700/50"
          >
            <FileText size={18} />
            <span className="text-sm">Docs</span>
            <ExternalLink size={14} className="ml-auto" />
          </Button>
        </a>
      </div>
    </aside>
  );
};
