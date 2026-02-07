import { Menu, Globe, LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCurrentUser } from '../services/authService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


interface HeaderProps {
  toggleSidebar: () => void;
}

export const Header = ({ toggleSidebar }: HeaderProps) => {
  const { handleLogout } = useCurrentUser();

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="w-9 h-9 cursor-pointer border-2 border-white shadow-md hover:shadow-lg transition-shadow">
              <AvatarImage src="https://lh3.googleusercontent.com/a/ACg8ocJ3ilDgcsIfVnYqK-DuXuMD5q8aCpkP4s9JHgRcAh7EQu2WlBk=s96-c" alt="User" />
              <AvatarFallback>US</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};