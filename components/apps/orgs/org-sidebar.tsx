"use client";

import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import {
  HiOutlineSquares2X2,
  HiOutlineCurrencyDollar,
  HiOutlineBanknotes,
  HiOutlineReceiptPercent,
  HiOutlineUsers,
  HiOutlineCog6Tooth,
  HiOutlineBriefcase,
  HiOutlineInbox,
  HiOutlineIdentification,
  HiOutlineClock,
  HiOutlineChevronRight,
  HiOutlineCube,
  HiOutlineTag,
  HiOutlineArrowPath,
  HiOutlineShoppingCart,
  HiOutlineTruck,
  HiOutlineArchiveBox,
  HiOutlineDocumentText,
  HiOutlineExclamationTriangle,
  HiOutlineChartBar,
} from "react-icons/hi2";
import { HiOutlineDocumentCurrencyDollar } from "react-icons/hi2";
import {
  Building2,
  ChevronUp,
  LogOut,
  Settings,
  User,
  LayoutDashboard,
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { authService, CurrentUser } from "@/lib/services/auth/auth.service";
import { cn } from "@/lib/utils";

// Types
interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface MenuGroup {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: MenuItem[];
}

export function OrganisationSideBar() {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const orgSlug = params.slug as string;

  const [openGroups, setOpenGroups] = useState<{ [key: string]: boolean }>({
  });

  const [user, setUser] = useState<CurrentUser>(null);


  useEffect(() => {
    let ignore = false;
    async function fetchUser() {
      try {
        const userData = await authService.getCurrentUser();
        console.log(userData);
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
    if (!u) return "U";
    if (u.last_name || u.last_name) {
      return `${u.last_name?.[0] ?? ""}${u.last_name?.[0] ?? ""}`.toUpperCase() || "U";
    }
    return u.email?.[0]?.toUpperCase() || "U";
  };

  const getDisplayName = (u: typeof user) => {
    if (!u) return "Utilisateur";
    if (u.last_name || u.first_name) {
      return [u.last_name, u.first_name].filter(Boolean).join(" ");
    }
    return u.email || "Utilisateur";
  };

  const getDisplayEmail = (u: typeof user) => u?.email || "—";

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      router.push("/auth");
    }
  };

  // Menu items
  const generalMenuItems: MenuItem[] = [
    {
      title: "Tableau de bord",
      url: `/apps/${orgSlug}/dashboard`,
      icon: LayoutDashboard,
    },
  ];

  // const comptaMenuGroups: MenuGroup[] = [
  //   {
  //     title: "Comptabilité",
  //     icon: HiOutlineCurrencyDollar,
  //     children: [
  //       { title: "Factures", url: `/apps/${orgSlug}/compta/invoices`, icon: HiOutlineReceiptPercent },
  //       { title: "Paiements", url: `/apps/${orgSlug}/compta/payments`, icon: HiOutlineBanknotes },
  //       { title: "Banque", url: `/apps/${orgSlug}/compta/bank`, icon: HiOutlineInbox },
  //       { title: "Clients", url: `/apps/${orgSlug}/compta/clients`, icon: HiOutlineIdentification },
  //       { title: "Fournisseurs", url: `/apps/${orgSlug}/compta/suppliers`, icon: HiOutlineBriefcase },
  //     ],
  //   },
  // ];

  const hrMenuGroups: MenuGroup[] = [
    {
      title: "RH",
      icon: HiOutlineUsers,
      children: [
        { title: "Vue d'ensemble", url: `/apps/${orgSlug}/hr`, icon: HiOutlineSquares2X2 },
        { title: "Départements", url: `/apps/${orgSlug}/hr/departments`, icon: Building2 },
        { title: "Employés", url: `/apps/${orgSlug}/hr/employees`, icon: HiOutlineUsers },
        { title: "Rôles", url: `/apps/${orgSlug}/hr/roles`, icon: HiOutlineBriefcase },
        { title: "Paie", url: `/apps/${orgSlug}/hr/payroll/`, icon: HiOutlineDocumentCurrencyDollar },
        { title: "Contrats", url: `/apps/${orgSlug}/hr/contracts`, icon: HiOutlineIdentification },
        { title: "Congés", url: `/apps/${orgSlug}/hr/leaves`, icon: HiOutlineBriefcase },
        { title: "Pointage", url: `/apps/${orgSlug}/hr/attendance`, icon: HiOutlineClock },
      ],
    },
  ];

  const inventoryMenuGroups: MenuGroup[] = [
    {
      title: "Stocks",
      icon: HiOutlineCube,
      children: [
        // Accès rapide - Actions principales
        { title: "Tableau de bord", url: `/apps/${orgSlug}/inventory`, icon: HiOutlineSquares2X2 },
        { title: "Caisse", url: `/apps/${orgSlug}/inventory/sales/quick`, icon: HiOutlineShoppingCart },
        
        // Gestion commerciale
        { title: "Ventes", url: `/apps/${orgSlug}/inventory/sales`, icon: HiOutlineReceiptPercent },
        { title: "Créances", url: `/apps/${orgSlug}/inventory/credit-sales`, icon: HiOutlineBanknotes },
        { title: "Achats", url: `/apps/${orgSlug}/inventory/orders`, icon: HiOutlineTruck },
        { title: "Dépenses", url: `/apps/${orgSlug}/inventory/expenses`, icon: HiOutlineCurrencyDollar },
        
        // Catalogue & Stock
        { title: "Produits", url: `/apps/${orgSlug}/inventory/products`, icon: HiOutlineCube },
        { title: "Catégories", url: `/apps/${orgSlug}/inventory/categories`, icon: HiOutlineTag },
        { title: "Stock", url: `/apps/${orgSlug}/inventory/warehouses`, icon: HiOutlineArchiveBox },
        { title: "Mouvements", url: `/apps/${orgSlug}/inventory/movements`, icon: HiOutlineArrowPath },
        
        // Contacts
        { title: "Clients", url: `/apps/${orgSlug}/inventory/customers`, icon: HiOutlineUsers },
        { title: "Fournisseurs", url: `/apps/${orgSlug}/inventory/suppliers`, icon: HiOutlineBriefcase },
        
        // Documents & Rapports
        { title: "Documents", url: `/apps/${orgSlug}/inventory/documents`, icon: HiOutlineDocumentText },
        { title: "Inventaire", url: `/apps/${orgSlug}/inventory/stock-counts`, icon: HiOutlineDocumentText },
        { title: "Alertes", url: `/apps/${orgSlug}/inventory/alerts`, icon: HiOutlineExclamationTriangle },
        { title: "Rapports", url: `/apps/${orgSlug}/inventory/reports`, icon: HiOutlineChartBar },
      ],
    },
  ];

  const isGroupActive = (group: MenuGroup) =>
    group.children.some((child) => pathname.startsWith(child.url));

  // Render menu group - version collapsed avec tooltip
  const renderMenuGroup = (group: MenuGroup) => {
    const isOpen = openGroups[group.title] ?? isGroupActive(group);
    const hasActiveChild = isGroupActive(group);

    // Mode collapsed - afficher juste l'icône avec dropdown
    if (isCollapsed) {
      return (
        <SidebarMenuItem key={group.title}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                tooltip={group.title}
                className={cn(
                  "justify-center",
                  hasActiveChild && "bg-primary/10 text-primary"
                )}
              >
                <group.icon className="size-5" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" sideOffset={8}>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                {group.title}
              </div>
              {group.children.map((child) => (
                <DropdownMenuItem key={child.title} asChild>
                  <Link
                    href={child.url}
                    className={cn(
                      "gap-2 cursor-pointer",
                      (pathname === child.url || pathname.startsWith(child.url + "/")) &&
                        "bg-primary/10 text-primary"
                    )}
                  >
                    <child.icon className="size-4" />
                    {child.title}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      );
    }

    // Mode expanded - collapsible normal
    return (
      <Collapsible
        key={group.title}
        open={isOpen}
        onOpenChange={(open) =>
          setOpenGroups((prev) => ({ ...prev, [group.title]: open }))
        }
        className="group/collapsible"
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              className={cn(
                "justify-between pr-2",
                hasActiveChild && "bg-primary/5 text-foreground font-medium"
              )}
            >
              <span className="flex items-center gap-3">
                <group.icon className={cn("size-5", hasActiveChild && "text-primary")} />
                <span>{group.title}</span>
              </span>
              <HiOutlineChevronRight
                className={cn(
                  "size-4 text-muted-foreground transition-transform duration-200",
                  isOpen && "rotate-90"
                )}
              />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent className="animate-in slide-in-from-top-1 duration-200">
            <SidebarMenuSub>
              {group.children.map((child) => {
                const isActive = pathname === child.url || pathname.startsWith(child.url + "/");
                return (
                  <SidebarMenuSubItem key={child.title}>
                    <SidebarMenuSubButton asChild isActive={isActive}>
                      <Link href={child.url} className="gap-3">
                        <child.icon className={cn("size-4", isActive && "text-primary")} />
                        <span>{child.title}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                );
              })}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
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
              tooltip={orgSlug || "Organisation"}
              className="hover:bg-transparent active:bg-transparent px-2"
            >
              <Link href={`/apps/${orgSlug}/dashboard`} className="gap-3">
                <div className={cn(
                  "flex aspect-square items-center justify-center rounded-xl font-bold text-sm shadow-sm transition-all",
                  "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground",
                  isCollapsed ? "size-10" : "size-10"
                )}>
                  {orgSlug?.[0]?.toUpperCase() || "O"}
                </div>
                {!isCollapsed && (
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate font-bold text-sm capitalize">
                      {user?.organization_name || "Organisation"}
                    </span>
                    <span className="truncate text-[11px] text-muted-foreground">
                      Espace de travail
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
        {/* Navigation */}
        <SidebarGroup className="px-0">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3 mb-1">
              Navigation
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {generalMenuItems.map((item) => {
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

        {/* Finances */}
        {/* <SidebarGroup className="px-0 mt-4">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3 mb-1">
              Finances
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>{comptaMenuGroups.map(renderMenuGroup)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup> */}

        {/* RH */}
        <SidebarGroup className="px-0 mt-4">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3 mb-1">
              Ressources Humaines
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>{hrMenuGroups.map(renderMenuGroup)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Stocks */}
        <SidebarGroup className="px-0 mt-4">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3 mb-1">
              Gestion des stocks
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>{inventoryMenuGroups.map(renderMenuGroup)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Spacer */}
        <div className="flex-1 min-h-4" />

        {/* Settings */}
        <SidebarGroup className="px-0 mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === `/apps/${orgSlug}/settings`}
                  tooltip="Paramètres"
                  className={cn(isCollapsed && "justify-center")}
                >
                  <Link href={`/apps/${orgSlug}/settings`} className="gap-3">
                    <HiOutlineCog6Tooth className={cn(
                      "size-5",
                      pathname === `/apps/${orgSlug}/settings` && "text-primary"
                    )} />
                    {!isCollapsed && <span>Paramètres</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
                    <Link href={`/apps/${orgSlug}/dashboard/profile`} className="cursor-pointer gap-3 py-2">
                      <User className="size-4" />
                      Mon profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/apps/${orgSlug}/dashboard/settings`} className="cursor-pointer gap-3 py-2">
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
                  >
                    <LogOut className="size-4" />
                    Se déconnecter
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
