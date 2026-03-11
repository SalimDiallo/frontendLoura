"use client";

import {
  Building2,
  ChevronUp,
  LayoutDashboard,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  HiOutlineArchiveBox,
  HiOutlineArrowPath,
  HiOutlineBanknotes,
  HiOutlineBriefcase,
  HiOutlineChartBar,
  HiOutlineChevronRight,
  HiOutlineClock,
  HiOutlineCog6Tooth,
  HiOutlineCube,
  HiOutlineCurrencyDollar,
  HiOutlineDocumentCurrencyDollar,
  HiOutlineDocumentText,
  HiOutlineExclamationTriangle,
  HiOutlineIdentification,
  HiOutlineReceiptPercent,
  HiOutlineShoppingCart,
  HiOutlineSquares2X2,
  HiOutlineTag,
  HiOutlineTruck,
  HiOutlineUsers
} from "react-icons/hi2";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { usePermissions } from "@/lib/hooks/use-permissions";
import { authService, CurrentUser } from "@/lib/services/auth/auth.service";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useEffect, useState } from "react";

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

// Fonction utilitaire pour nettoyer les tableaux de menu (retirer les null / undefined / false)
function filterNotNull<T>(arr: (T | null | undefined | false)[]): T[] {
  return arr.filter((item): item is T => item !== null && item !== undefined && item !== false);
}

export function OrganisationSideBar() {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const { state } = useSidebar();
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();
  const isCollapsed = state === "collapsed";
  const orgSlug = params.slug as string;

  const [openGroups, setOpenGroups] = useState<{ [key: string]: boolean }>({});

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
    if (u.last_name || u.first_name) {
      const ln = u.last_name?.[0] ?? "";
      const fn = u.first_name?.[0] ?? "";
      const initials = `${ln}${fn}`.toUpperCase();
      return initials || "U";
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
      title: "Accueil",
      url: `/apps/${orgSlug}/dashboard`,
      icon: LayoutDashboard,
    },
  ];

  // RH group: get the list of permissions for RH and if none are granted, hide ALL menus (return null in render)
  // Inventaire group: get the list of permissions for inventory and if none are granted, hide ALL menus (return null in render)
  // We'll check that before the actual render block.

  // Find all the permissions required for the HR menu group
  const hrRequiredPermissions: string[] = [
    COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES,
    COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS,
    COMMON_PERMISSIONS.HR.VIEW_LEAVE_REQUESTS,
    COMMON_PERMISSIONS.HR.VIEW_POSITIONS,
    COMMON_PERMISSIONS.HR.VIEW_ROLES,
    COMMON_PERMISSIONS.HR.VIEW_CONTRACTS,
  ];
  // Remove "Paie", "Congés", "Pointage" which do not check permissions in code - you can only hide the group by permission checks on above.

  // For inventory, get all possible relevant permissions
  const inventoryRequiredPermissions: string[] = [
    COMMON_PERMISSIONS.INVENTORY.CREATE_SALES,
    COMMON_PERMISSIONS.INVENTORY.VIEW_SALES,
    COMMON_PERMISSIONS.INVENTORY.VIEW_ORDERS,
    COMMON_PERMISSIONS.INVENTORY.VIEW_EXPENSES,
    COMMON_PERMISSIONS.INVENTORY.VIEW_PRODUCTS,
    COMMON_PERMISSIONS.INVENTORY.VIEW_CATEGORIES,
    COMMON_PERMISSIONS.INVENTORY.VIEW_WAREHOUSES,
    COMMON_PERMISSIONS.INVENTORY.VIEW_STOCK,
    COMMON_PERMISSIONS.INVENTORY.VIEW_CUSTOMERS,
    COMMON_PERMISSIONS.INVENTORY.VIEW_SUPPLIERS,
    COMMON_PERMISSIONS.INVENTORY.MANAGE_DOCUMENTS,
    COMMON_PERMISSIONS.INVENTORY.VIEW_STOCK_COUNTS,
    COMMON_PERMISSIONS.INVENTORY.VIEW_REPORTS,
  ];

  // Evaluate if user has any permission for HR or Inventory
  const hasHRPermission =
    hrRequiredPermissions.some((perm) => hasPermission(perm));
  const hasInventoryPermission =
    inventoryRequiredPermissions.some((perm) => hasPermission(perm));

  // If user does NOT have HR permissions, RH menus are all hidden (there won't even be "Paie", etc.)
  // If user does NOT have inventory permissions, inventory menus are all hidden.

  // Compose HR menu group only if hasHRPermission
  const hrMenuGroups: MenuGroup[] = [
        {
          title: "RH",
          icon: HiOutlineUsers,
          children: filterNotNull([
            hasAnyPermission([
              COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES,
              COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS,
              COMMON_PERMISSIONS.HR.VIEW_LEAVE_REQUESTS,
            ]) && {
              title: "Vue d'ensemble",
              url: `/apps/${orgSlug}/hr`,
              icon: HiOutlineSquares2X2,
            },
            hasAnyPermission([
              COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS,
              COMMON_PERMISSIONS.HR.VIEW_POSITIONS,
            ]) && {
              title: "Départements & Postes",
              url: `/apps/${orgSlug}/hr/departments`,
              icon: Building2,
            },
            hasPermission(COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES) && {
              title: "Employés",
              url: `/apps/${orgSlug}/hr/employees`,
              icon: HiOutlineUsers,
            },
            hasPermission(COMMON_PERMISSIONS.HR.VIEW_ROLES) && {
              title: "Rôles",
              url: `/apps/${orgSlug}/hr/roles`,
              icon: HiOutlineBriefcase,
            },
            { title: "Paie", url: `/apps/${orgSlug}/hr/payroll/`, icon: HiOutlineDocumentCurrencyDollar },
            hasPermission(COMMON_PERMISSIONS.HR.VIEW_CONTRACTS) && {
              title: "Contrats",
              url: `/apps/${orgSlug}/hr/contracts`,
              icon: HiOutlineIdentification,
            },
            { title: "Congés", url: `/apps/${orgSlug}/hr/leaves`, icon: HiOutlineBriefcase },
            { title: "Pointage", url: `/apps/${orgSlug}/hr/attendance`, icon: HiOutlineClock },
          ]),
        },
      ];

  // Compose Inventory menu group only if hasInventoryPermission
  const inventoryMenuGroups: MenuGroup[] = !hasInventoryPermission
    ? []
    : [
        {
          title: "Gestion des stocks",
          icon: HiOutlineCube,
          children: filterNotNull([
            { title: "Tableau de bord", url: `/apps/${orgSlug}/inventory`, icon: HiOutlineSquares2X2 },
            hasPermission(COMMON_PERMISSIONS.INVENTORY.CREATE_SALES)
              ? { title: "Caisse", url: `/apps/${orgSlug}/inventory/sales/quick`, icon: HiOutlineShoppingCart }
              : null,
            hasPermission(COMMON_PERMISSIONS.INVENTORY.VIEW_SALES)
              ? { title: "Ventes", url: `/apps/${orgSlug}/inventory/sales`, icon: HiOutlineReceiptPercent }
              : null,
            hasPermission(COMMON_PERMISSIONS.INVENTORY.VIEW_SALES)
              ? { title: "Créances", url: `/apps/${orgSlug}/inventory/credit-sales`, icon: HiOutlineBanknotes }
              : null,
            hasPermission(COMMON_PERMISSIONS.INVENTORY.VIEW_ORDERS)
              ? { title: "Approvisionnement", url: `/apps/${orgSlug}/inventory/orders`, icon: HiOutlineTruck }
              : null,
            hasPermission(COMMON_PERMISSIONS.INVENTORY.VIEW_EXPENSES)
              ? { title: "Dépenses", url: `/apps/${orgSlug}/inventory/expenses`, icon: HiOutlineCurrencyDollar }
              : null,
            hasPermission(COMMON_PERMISSIONS.INVENTORY.VIEW_PRODUCTS)
              ? { title: "Produits", url: `/apps/${orgSlug}/inventory/products`, icon: HiOutlineCube }
              : null,
            hasPermission(COMMON_PERMISSIONS.INVENTORY.VIEW_CATEGORIES)
              ? { title: "Catégories", url: `/apps/${orgSlug}/inventory/categories`, icon: HiOutlineTag }
              : null,
            hasPermission(COMMON_PERMISSIONS.INVENTORY.VIEW_WAREHOUSES)
              ? { title: "Entrepôts", url: `/apps/${orgSlug}/inventory/warehouses`, icon: HiOutlineArchiveBox }
              : null,
            hasPermission(COMMON_PERMISSIONS.INVENTORY.VIEW_STOCK)
              ? { title: "Mouvements Stocks", url: `/apps/${orgSlug}/inventory/movements`, icon: HiOutlineArrowPath }
              : null,
            hasPermission(COMMON_PERMISSIONS.INVENTORY.VIEW_CUSTOMERS)
              ? { title: "Clients", url: `/apps/${orgSlug}/inventory/customers`, icon: HiOutlineUsers }
              : null,
            hasPermission(COMMON_PERMISSIONS.INVENTORY.VIEW_SUPPLIERS)
              ? { title: "Fournisseurs", url: `/apps/${orgSlug}/inventory/suppliers`, icon: HiOutlineBriefcase }
              : null,
            hasPermission(COMMON_PERMISSIONS.INVENTORY.MANAGE_DOCUMENTS)
              ? { title: "Documents", url: `/apps/${orgSlug}/inventory/documents`, icon: HiOutlineDocumentText }
              : null,
            hasPermission(COMMON_PERMISSIONS.INVENTORY.VIEW_SALES) && {
              title: "Bons de livraison",
              url: `/apps/${orgSlug}/inventory/documents/delivery-notes`,
              icon: HiOutlineTruck,
            },
            hasPermission(COMMON_PERMISSIONS.INVENTORY.VIEW_STOCK_COUNTS)
              ? { title: "Inventaire", url: `/apps/${orgSlug}/inventory/stock-counts`, icon: HiOutlineDocumentText }
              : null,
            hasAllPermissions([
              COMMON_PERMISSIONS.INVENTORY.VIEW_STOCK,
              COMMON_PERMISSIONS.INVENTORY.VIEW_SALES,
            ])
              ? { title: "Alertes", url: `/apps/${orgSlug}/inventory/alerts`, icon: HiOutlineExclamationTriangle }
              : null,
            hasPermission(COMMON_PERMISSIONS.INVENTORY.VIEW_REPORTS)
              ? { title: "Rapports", url: `/apps/${orgSlug}/inventory/reports`, icon: HiOutlineChartBar }
              : null,
          ]),
        },
      ];

  const isGroupActive = (group: MenuGroup) =>
    group.children.some((child) => pathname.startsWith(child.url));

  // Render menu group - version collapsed avec tooltip
  const renderMenuGroup = (group: MenuGroup) => {
    if (group.children.length === 0) {
      return null;
    }

    const isOpen = openGroups[group.title] ?? isGroupActive(group);
    const hasActiveChild = isGroupActive(group);

    if (isCollapsed) {
      return (
        <SidebarMenuItem key={group.title}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                tooltip={group.title}
                className={cn(
                  "justify-center h-10 p-0",
                  hasActiveChild && "bg-primary/10 text-primary"
                )}
              >
                <group.icon className="size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" sideOffset={8}>
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                {group.title}
              </div>
              {group.children.map((child) => (
                <DropdownMenuItem key={child.title} asChild>
                  <Link
                    href={child.url}
                    className={cn(
                      "gap-2 cursor-pointer text-sm",
                      (pathname === child.url || pathname.startsWith(child.url + "/")) &&
                        "bg-primary/10 text-primary"
                    )}
                  >
                    <child.icon className="size-3.5" />
                    {child.title}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      );
    }

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
                "justify-between pr-1 min-h-9 h-9",
                hasActiveChild && "bg-primary/5 text-foreground font-medium"
              )}
            >
              <span className="flex items-center gap-2">
                <group.icon className={cn("size-4", hasActiveChild && "text-primary")} />
                <span className="text-[14px]">{group.title}</span>
              </span>
              <HiOutlineChevronRight
                className={cn(
                  "size-3.5 text-muted-foreground transition-transform duration-200",
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
                    <SidebarMenuSubButton asChild isActive={isActive} className="min-h-8 h-8">
                      <Link href={child.url} className="gap-2">
                        <child.icon className={cn("size-3.5", isActive && "text-primary")} />
                        <span className="text-sm">{child.title}</span>
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

  // Hide ALL navigation menus if the user has neither HR nor Inventory permissions (as per rule)
  // const showMenus =
  //   hasHRPermission || hasInventoryPermission;
  const showMenus = true
  return (
    <Sidebar collapsible="icon" className="border-r-0 text-[14px]">
      {/* Header */}
      <SidebarHeader className="h-13 flex items-center justify-center border-b border-border/30">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="sm"
              asChild
              tooltip={orgSlug || "Organisation"}
              className="hover:bg-transparent active:bg-transparent px-1.5"
              style={{ minHeight: "44px", height: "44px" }}
            >
              <Link href={`/apps/${orgSlug}/dashboard`} className="gap-2">
                {/* logo sera ici de lentreprise  */}
                <Image src={"/images/logo.png"} alt="logo de lentreprise" width={20} height={20} />
                {!isCollapsed && (
                  <div className="grid flex-1 text-left leading-tight hover:text-primary">
                    <span className="truncate font-bold text-xs capitalize hover:text-primary">
                      {user?.organization?.name || "Organisation"}
                    </span>
                    <span className="truncate text-[10px] text-muted-foreground">
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
      <SidebarContent className="px-1 py-3">
        {showMenus && (
          <>
            {/* Navigation */}
            <SidebarGroup className="px-0">
              {!isCollapsed && (
                <SidebarGroupLabel className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3 mb-1">
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
                          className={cn(isCollapsed && "justify-center", "h-9 min-h-9")}
                        >
                          <Link href={item.url} className="gap-2">
                            <item.icon className={cn("size-4", isActive && "text-primary")} />
                            {!isCollapsed && <span className="text-[14px]">{item.title}</span>}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* RH */}
            {hrMenuGroups.length > 0 && hrMenuGroups.some((g) => g.children.length > 0) && (
              <SidebarGroup className="px-0 mt-3">
                {!isCollapsed && (
                  <SidebarGroupLabel className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3 mb-1">
                    Ressources Humaines
                  </SidebarGroupLabel>
                )}
                <SidebarGroupContent>
                  <SidebarMenu>{hrMenuGroups.map(renderMenuGroup)}</SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* Stocks */}
            {inventoryMenuGroups.length > 0 &&
              inventoryMenuGroups.some((g) => g.children.length > 0) && (
                <SidebarGroup className="px-0 mt-3">
                  {!isCollapsed && (
                    <SidebarGroupLabel className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3 mb-1">
                      Gestion des stocks
                    </SidebarGroupLabel>
                  )}
                  <SidebarGroupContent>
                    <SidebarMenu>{inventoryMenuGroups.map(renderMenuGroup)}</SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              )}

            {/* Spacer */}
            <div className="flex-1 min-h-2" />

            {/* Settings */}
            <SidebarGroup className="px-0 mt-auto">
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === `/apps/${orgSlug}/settings`}
                      tooltip="Paramètres"
                      className={cn(isCollapsed && "justify-center", "h-9 min-h-9")}
                    >
                      <Link href={`/apps/${orgSlug}/settings`} className="gap-2">
                        <HiOutlineCog6Tooth
                          className={cn(
                            "size-4",
                            pathname === `/apps/${orgSlug}/settings` && "text-primary"
                          )}
                        />
                        {!isCollapsed && (
                          <span className="text-[14px]">Paramètres</span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-border/30 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="sm"
                  tooltip={getDisplayName(user)}
                  className={cn(
                    "w-full data-[state=open]:bg-primary",
                    isCollapsed && "justify-center px-0 min-h-9 h-9"
                  )}
                  style={{ minHeight: "36px", height: "36px" }}
                >
                  <Avatar className={cn("rounded-xl", isCollapsed ? "size-7" : "size-7")}>
                    <AvatarFallback className="rounded-xl bg-linear-to-br from-primary/20 to-primary/10 text-primary text-[11px] font-bold">
                      {getInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <>
                      <div className="grid flex-1 text-left text-[13px] leading-tight">
                        <span className="truncate font-semibold text-xs">
                          {getDisplayName(user)}
                        </span>
                        <span className="truncate text-[10px] text-muted-foreground">
                          {getDisplayEmail(user)}
                        </span>
                      </div>
                      <ChevronUp className="size-3.5 text-muted-foreground" />
                    </>
                  )}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56"
                side={isCollapsed ? "right" : "top"}
                align={isCollapsed ? "start" : "start"}
                sideOffset={8}
              >
                <div className="px-3 py-2 border-b border-border/40">
                  <p className="text-xs font-semibold">{getDisplayName(user)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{getDisplayEmail(user)}</p>
                </div>
                <div className="p-1">
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/apps/${orgSlug}/dashboard/profile`}
                      className="cursor-pointer gap-2 py-1.5 text-sm"
                    >
                      <User className="size-3.5" />
                      Mon profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/apps/${orgSlug}/dashboard/settings`}
                      className="cursor-pointer gap-2 py-1.5 text-sm"
                    >
                      <Settings className="size-3.5" />
                      Paramètres du compte
                    </Link>
                  </DropdownMenuItem>
                </div>
                <DropdownMenuSeparator />
                <div className="p-1">
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 py-1.5 text-destructive focus:text-destructive focus:bg-destructive/10 text-sm"
                    onClick={handleLogout}
                  >
                    <LogOut className="size-3.5" />
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