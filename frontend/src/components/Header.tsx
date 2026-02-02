import React from 'react';
import { Search, Menu, Globe, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface HeaderProps {
  toggleSidebar: () => void;
}

export const Header = ({ toggleSidebar }: HeaderProps) => {
  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200 shadow-sm z-40">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-slate-400 hover:text-slate-700">
          <Menu size={20} />
        </Button>
        <h1 className="text-xl font-bold text-slate-800">Models</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Language Switcher */}
        <Button variant="ghost" size="sm" className="flex items-center gap-1 text-slate-500 hover:text-[#6E29F6]">
          <Globe size={16} />
          <span>EN</span>
        </Button>

        {/* User Profile */}
        <Avatar className="w-9 h-9 cursor-pointer border-2 border-white shadow-md hover:shadow-lg transition-shadow">
          <AvatarImage src="https://lh3.googleusercontent.com/a/ACg8ocJ3ilDgcsIfVnYqK-DuXuMD5q8aCpkP4s9JHgRcAh7EQu2WlBk=s96-c" alt="User" />
          <AvatarFallback>US</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
};