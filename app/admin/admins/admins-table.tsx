"use client"

import { useMemo, useState } from "react"
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, useReactTable } from "@tanstack/react-table"
import { IconDotsVertical, IconSearch, IconShield, IconTrash, IconUserStar } from "@tabler/icons-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { removeRole, setRole } from "./actions"

type AdminUser = {
  id: string
  email: string
  role: string | undefined
  imageUrl: string
  createdAt: number
  lastActiveAt: number | null
}

const roleLabels: Record<string, { label: string; variant: "default" | "secondary" }> = {
  admin: { label: "مشرف", variant: "default" },
  project_owner: { label: "صاحب مشروع", variant: "secondary" },
}

function formatRelativeTime(epochMs: number): string {
  const now = Date.now()
  const diff = now - epochMs
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return "الآن"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `منذ ${minutes} دقيقة`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `منذ ${hours} ساعة`
  const days = Math.floor(hours / 24)
  if (days < 30) return `منذ ${days} يوم`
  const months = Math.floor(days / 30)
  if (months < 12) return `منذ ${months} شهر`
  const years = Math.floor(months / 12)
  return `منذ ${years} سنة`
}

function RoleActions({ userId, currentRole }: { userId: string; currentRole: string | undefined }) {
  function handleSetAdmin() {
    const fd = new FormData()
    fd.set("id", userId)
    fd.set("role", "admin")
    setRole(fd)
  }

  function handleSetProjectOwner() {
    const fd = new FormData()
    fd.set("id", userId)
    fd.set("role", "project_owner")
    setRole(fd)
  }

  function handleRemove() {
    const fd = new FormData()
    fd.set("id", userId)
    removeRole(fd)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm">
          <IconDotsVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {currentRole !== "admin" && (
          <DropdownMenuItem onSelect={handleSetAdmin}>
            <IconShield className="size-4" />
            تعيين كمشرف
          </DropdownMenuItem>
        )}
        {currentRole !== "project_owner" && (
          <DropdownMenuItem onSelect={handleSetProjectOwner}>
            <IconUserStar className="size-4" />
            تعيين كصاحب مشروع
          </DropdownMenuItem>
        )}
        {currentRole && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={handleRemove}>
              <IconTrash className="size-4" />
              إزالة الدور
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AdminsTable({ data }: { data: AdminUser[] }) {
  const [globalFilter, setGlobalFilter] = useState("")

  const columns = useMemo<ColumnDef<AdminUser>[]>(
    () => [
      {
        accessorKey: "email",
        header: "البريد الإلكتروني",
        cell: ({ row }) => {
          const user = row.original
          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-8">
                <AvatarImage src={user.imageUrl} alt={user.email} />
                <AvatarFallback>{user.email.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{user.email}</span>
            </div>
          )
        },
      },
      {
        accessorKey: "createdAt",
        header: "تاريخ الإنشاء",
        cell: ({ row }) => {
          const ms = row.original.createdAt
          return <span className="text-muted-foreground">{formatRelativeTime(ms)}</span>
        },
      },
      {
        accessorKey: "lastActiveAt",
        header: "آخر نشاط",
        cell: ({ row }) => {
          const ms = row.original.lastActiveAt
          if (!ms) return <span className="text-muted-foreground">—</span>
          return <span className="text-muted-foreground">{formatRelativeTime(ms)}</span>
        },
      },
      {
        accessorKey: "role",
        header: "الدور",
        cell: ({ getValue }) => {
          const role = getValue() as string | undefined
          if (!role) return null
          const config = roleLabels[role] ?? { label: role, variant: "outline" as const }
          return <Badge variant={config.variant}>{config.label}</Badge>
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => <RoleActions userId={row.original.id} currentRole={row.original.role} />,
      },
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <IconSearch className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="بحث بالبريد الإلكتروني..."
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="ps-9"
        />
      </div>
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  لا توجد نتائج
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
