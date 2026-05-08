"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { IconArrowLeft, IconBell, IconFolder, IconLayoutDashboard, IconLogout, IconUsers } from "@tabler/icons-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

const navItems = [
  { title: "الرئيسية", href: "/admin", icon: IconLayoutDashboard },
  { title: "المشاريع", href: "/admin/projects", icon: IconFolder },
  { title: "المشرفين", href: "/admin/admins", icon: IconUsers },
  { title: "الإشعارات", href: "/admin/notifications", icon: IconBell },
]

export function AdminSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar side="right" collapsible="icon">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild tooltip="لوحة التحكم">
                  <Link href="/admin">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/10">
                      <Image
                        src="/design/logo.png"
                        alt="مشاريع التخرج"
                        className="size-5 w-auto"
                        width={20}
                        height={20}
                      />
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-heading text-sm font-bold">لوحة التحكم</span>
                      <span className="text-[11px] text-muted-foreground">مشاريع التخرج</span>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => {
                    const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                          <Link href={item.href}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="العودة للموقع">
                  <Link href="/">
                    <IconArrowLeft className="rtl:rotate-180" />
                    <span>العودة للموقع</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <div className="mx-2 border-t border-sidebar-border" />
            <div className="flex items-center gap-2 px-2 py-1">
              <Avatar size="sm">
                <AvatarFallback>أ</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 items-center justify-between group-data-[collapsible=icon]:hidden">
                <div className="flex flex-col">
                  <span className="truncate text-sm font-medium">أحمد</span>
                  <span className="text-xs text-muted-foreground">مشرف</span>
                </div>
                <Button variant="ghost" size="icon-sm" className="shrink-0 text-muted-foreground">
                  <IconLogout className="size-4" />
                </Button>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-12 items-center gap-3 border-b px-4">
            <SidebarTrigger />
          </header>
          <div className="flex-1 p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
