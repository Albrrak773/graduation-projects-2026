"use client"

import { useMemo, useState } from "react"
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, useReactTable } from "@tanstack/react-table"
import { IconDotsVertical, IconEye, IconEyeOff, IconPlus, IconSearch, IconTrash } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { addAdmin, deleteAdmin } from "./actions"

type AdminRow = {
  id: string
  email: string
  createdAt: Date | null
}

function formatRelativeDate(date: Date | null): string {
  if (!date) return "—"
  const now = Date.now()
  const diff = now - date.getTime()
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

function AdminActions({ adminId }: { adminId: string }) {
  function handleDelete() {
    const fd = new FormData()
    fd.set("id", adminId)
    deleteAdmin(fd)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm">
          <IconDotsVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem variant="destructive" onSelect={handleDelete}>
          <IconTrash className="size-4" />
          حذف المشرف
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function AddAdminDialog() {
  const [open, setOpen] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  async function handleSubmit(formData: FormData) {
    await addAdmin(formData)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <IconPlus className="size-4" />
          إضافة مشرف
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة مشرف جديد</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-email">البريد الإلكتروني</Label>
            <Input id="add-email" name="email" type="email" required dir="ltr" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-password">كلمة المرور</Label>
            <div className="relative">
              <Input
                id="add-password"
                name="password"
                type={showNewPassword ? "text" : "password"}
                required
                dir="ltr"
                minLength={8}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((v) => !v)}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
                aria-label={showNewPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              >
                {showNewPassword ? <IconEyeOff className="size-4" /> : <IconEye className="size-4" />}
              </button>
            </div>
          </div>
          <Button type="submit">إضافة</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function AdminsTable({ data }: { data: AdminRow[] }) {
  const [globalFilter, setGlobalFilter] = useState("")

  const columns = useMemo<ColumnDef<AdminRow>[]>(
    () => [
      {
        accessorKey: "email",
        header: "البريد الإلكتروني",
        cell: ({ row }) => {
          const user = row.original
          return (
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary uppercase">
                {user.email.charAt(0)}
              </div>
              <span className="font-medium">{user.email}</span>
            </div>
          )
        },
      },
      {
        accessorKey: "createdAt",
        header: "تاريخ الإنشاء",
        cell: ({ row }) => {
          const date = row.original.createdAt
          return <span className="text-muted-foreground">{formatRelativeDate(date)}</span>
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => <AdminActions adminId={row.original.id} />,
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
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <IconSearch className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="بحث بالبريد الإلكتروني..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="ps-9"
          />
        </div>
        <AddAdminDialog />
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
