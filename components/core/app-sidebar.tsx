"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  HiOutlineBuildingOffice2,
  HiOutlineCog6Tooth,
} from "react-icons/hi2";
import {
  ChevronUp,
  LogOut,
  Settings,
  User,
  Sparkles,
  LayoutDashboard,
  Users,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { authService } from "@/lib/services/core";
import { cn } from "@/lib/utils";

// Types
interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

// Menu principal
const mainMenuItems: MenuItem[] = [
  {
    title: "Tableau de bord",
    url: "/core/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Organisations",
    url: "/core/dashboard/organizations",
    icon: HiOutlineBuildingOffice2,
  },
];

// Menu de gestion
const managementMenuItems: MenuItem[] = [
  {
    title: "Utilisateurs",
    url: "/core/dashboard/users",
    icon: Users,
  },
  {
    title: "Paramètres",
    url: "/core/dashboard/settings",
    icon: HiOutlineCog6Tooth,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [user, setUser] = useState<{
    email?: string;
    firstName?: string;
    lastName?: string;
  } | null>(null);

  useEffect(() => {
    let ignore = false;
    async function fetchUser() {
      try {
        const userData = await authService.getCurrentUser();
        if (!ignore) setUser(userData ?? null);
      } catch {
        if (!ignore) setUser(null);
      }
    }
    fetchUser();
    return () => {
      ignore = true;
    };
  }, []);

  const getInitials = (u: typeof user) => {
    if (!u) return "A";
    if (u.firstName || u.lastName) {
      return `${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`.toUpperCase() || "A";
    }
    return u.email?.[0]?.toUpperCase() || "A";
  };

  const getDisplayName = (u: typeof user) => {
    if (!u) return "Admin";
    if (u.firstName || u.lastName) {
      return [u.firstName, u.lastName].filter(Boolean).join(" ");
    }
    return u.email || "Admin";
  };

  const getDisplayEmail = (u: typeof user) => u?.email || "admin@loura.com";

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await authService.logout();
      router.push("/auth/admin");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      router.push("/auth/admin");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      {/* Header */}
      <SidebarHeader className="h-16 flex items-center justify-center border-b border-border/30">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              tooltip="Loura"
              className="hover:bg-transparent active:bg-transparent px-2"
            >
              <Link href="/core/dashboard" className="gap-3">
                <div className={cn(
                  "flex aspect-square items-center justify-center rounded-xl font-bold text-sm transition-all",
                  "bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground",
                  "shadow-lg shadow-primary/20",
                  isCollapsed ? "size-10" : "size-10"
                )}>
                  L
                </div>
                {!isCollapsed && (
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate font-bold text-base tracking-tight">
                      Loura
                    </span>
                    <span className="truncate text-[11px] text-muted-foreground">
                      Plateforme de gestion
                    </span>
                  </div>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent className="px-2 py-4">
        {/* Menu Principal */}
        <SidebarGroup className="px-0">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3 mb-1">
              Principal
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={cn(isCollapsed && "justify-center")}
                    >
                      <Link href={item.url} className="gap-3">
                        <item.icon className={cn("size-5", isActive && "text-primary")} />
                        {!isCollapsed && (
                          <>
                            <span className="flex-1">{item.title}</span>
                            {item.badge && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Menu de Gestion */}
        <SidebarGroup className="px-0 mt-4">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3 mb-1">
              Administration
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {managementMenuItems.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={cn(isCollapsed && "justify-center")}
                    >
                      <Link href={item.url} className="gap-3">
                        <item.icon className={cn("size-5", isActive && "text-primary")} />
                        {!isCollapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Spacer */}
        <div className="flex-1 min-h-4" />

        {/* Upgrade Card - Only when expanded */}
        {!isCollapsed && (
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              <div className="mx-1 rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-4 border border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <Sparkles className="size-4 text-primary" />
                  </div>
                  <span className="text-xs font-bold text-primary uppercase tracking-wide">
                    Pro
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Débloquez toutes les fonctionnalités avancées avec Loura Pro.
                </p>
                <button className="mt-3 w-full text-xs font-semibold py-2.5 px-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md">
                  Découvrir Pro
                </button>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-border/30 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  tooltip={getDisplayName(user)}
                  className={cn(
                    "w-full data-[state=open]:bg-accent",
                    isCollapsed && "justify-center px-0"
                  )}
                >
                  <Avatar className={cn("rounded-xl", isCollapsed ? "size-9" : "size-9")}>
                    <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-xs font-bold">
                      {getInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold text-[13px]">
                          {getDisplayName(user)}
                        </span>
                        <span className="truncate text-[11px] text-muted-foreground">
                          {getDisplayEmail(user)}
                        </span>
                      </div>
                      <ChevronUp className="size-4 text-muted-foreground" />
                    </>
                  )}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-64"
                side={isCollapsed ? "right" : "top"}
                align={isCollapsed ? "start" : "start"}
                sideOffset={8}
              >
                <div className="px-3 py-3 border-b border-border/40">
                  <p className="text-sm font-semibold">{getDisplayName(user)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{getDisplayEmail(user)}</p>
                </div>
                <div className="p-1">
                  <DropdownMenuItem asChild>
                    <Link href="/core/dashboard/profile" className="cursor-pointer gap-3 py-2">
                      <User className="size-4" />
                      Mon profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/core/dashboard/settings" className="cursor-pointer gap-3 py-2">
                      <Settings className="size-4" />
                      Paramètres du compte
                    </Link>
                  </DropdownMenuItem>
                </div>
                <DropdownMenuSeparator />
                <div className="p-1">
                  <DropdownMenuItem
                    className="cursor-pointer gap-3 py-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    <LogOut className="size-4" />
                    {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
