import type { View, User } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  Upload,
  BarChart3,
} from "lucide-react";

// Assets - temporarily using text logo instead of image

interface NavbarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  isAuthenticated: boolean;
  onLogout: () => void;
  user: User | null;
}

const Navbar = ({
  currentView,
  onNavigate,
  isAuthenticated,
  onLogout,
  user,
}: NavbarProps) => {
  const isActive = (view: View) => currentView === view;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => onNavigate(isAuthenticated ? "dashboard" : "home")}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Examzz
          </span>
        </div>

        <div className="hidden md:flex items-center gap-6">
          {isAuthenticated ? (
            <>
              <button
                onClick={() => onNavigate("dashboard")}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive("dashboard")
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => onNavigate("upload")}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive("upload") ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Upload
              </button>
              <button
                onClick={() => onNavigate("dashboard")}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive("quiz") ? "text-primary" : "text-muted-foreground"
                }`}
              >
                My Quizzes
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onNavigate("home")}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive("home") ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Home
              </button>
              <button
                onClick={() => onNavigate("login")}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive("login") ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Login
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-indigo-100">
                    <UserIcon className="h-5 w-5 text-violet-600" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user?.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {user?.isPremium ? "Premium Member" : "Free Plan"}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onNavigate("dashboard")}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate("upload")}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Files
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate("dashboard")}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Progress
                </DropdownMenuItem>
                {user?.email === "admin@studyquiz.com" && (
                  <DropdownMenuItem onClick={() => onNavigate("admin")}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Admin Panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" onClick={() => onNavigate("login")}>
                Sign In
              </Button>
              <Button
                onClick={() => onNavigate("register")}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
              >
                Get Started
              </Button>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="md:hidden">
              {isAuthenticated ? (
                <>
                  <DropdownMenuItem onClick={() => onNavigate("dashboard")}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate("upload")}>
                    Upload
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onLogout} className="text-red-600">
                    Log out
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => onNavigate("home")}>
                    Home
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate("login")}>
                    Sign In
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate("register")}>
                    Get Started
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
