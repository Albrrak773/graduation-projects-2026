'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export const SearchUsers = () => {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const form = e.currentTarget
          const formData = new FormData(form)
          const queryTerm = formData.get('search') as string
          router.push(pathname + '?search=' + queryTerm)
        }}
      >
        <label htmlFor="search">Search for users</label>
        <Input id="search" name="search" type="text" />
        <Button type="submit">Submit</Button>
      </form>
    </div>
  )
}