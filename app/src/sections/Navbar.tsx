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
  Crown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  const isPremium = user?.isPremium === true || user?.planType === "premium";

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => onNavigate(isAuthenticated ? "dashboard" : "home")}
        >
          <span
            className="text-2xl font-black text-black tracking-wider"
            style={{
              fontFamily:
                'Blanka, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            EXAMZZ
          </span>
          {isPremium && (
            <Badge className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0 text-xs px-2 py-0">
              <Crown className="w-3 h-3 mr-1" />
              Supporter
            </Badge>
          )}
        </div>

        {/* Desktop nav links */}
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
              {/* Pricing — show Upgrade CTA for free users, plain link for supporters */}
              {isPremium ? (
                <button
                  onClick={() => onNavigate("pricing")}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive("pricing")
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  Pricing
                </button>
              ) : (
                <button
                  onClick={() => onNavigate("pricing")}
                  className="text-sm font-medium text-violet-600 hover:text-violet-700 flex items-center gap-1"
                >
                  <Crown className="w-3.5 h-3.5" />
                  Upgrade
                </button>
              )}
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
                onClick={() => onNavigate("pricing")}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive("pricing") ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Pricing
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

        {/* Right side */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      isPremium
                        ? "bg-gradient-to-br from-violet-500 to-indigo-600"
                        : "bg-gradient-to-br from-violet-100 to-indigo-100"
                    }`}
                  >
                    {isPremium ? (
                      <Crown className="h-5 w-5 text-white" />
                    ) : (
                      <UserIcon className="h-5 w-5 text-violet-600" />
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-sm">
                      {user?.nickname || user?.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email}
                    </p>
                    {isPremium ? (
                      <span className="text-xs text-violet-600 font-medium flex items-center gap-1">
                        <Crown className="w-3 h-3" /> Supporter
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Free Plan
                      </span>
                    )}
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
                {!isPremium && (
                  <DropdownMenuItem
                    onClick={() => onNavigate("pricing")}
                    className="text-violet-600 font-medium"
                  >
                    <Crown className="mr-2 h-4 w-4" />
                    Upgrade to Supporter
                  </DropdownMenuItem>
                )}
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

          {/* Mobile hamburger */}
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
                  <DropdownMenuItem onClick={() => onNavigate("pricing")}>
                    {isPremium ? "Pricing" : "⚡ Upgrade"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout} className="text-red-600">
                    Log out
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => onNavigate("home")}>
                    Home
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate("pricing")}>
                    Pricing
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
