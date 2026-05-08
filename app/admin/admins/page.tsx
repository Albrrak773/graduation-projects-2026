import { SearchUsers } from './SearchUsers'
import { clerkClient } from '@clerk/nextjs/server'
import { removeRole, setRole } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default async function AdminDashboard(params: {
  searchParams: Promise<{ search?: string }>
}) {
  const query = (await params.searchParams).search

  const client = await clerkClient()

  const users = query ? (await client.users.getUserList({ query })).data : []

  return (
    <div dir="ltr">
      <p>This is the protected admin dashboard restricted to users with the `admin` Role.</p>

      <SearchUsers />

      {users.map((user) => {
        return (
          <div key={user.id}>
            <div>
              {user.firstName} {user.lastName}
            </div>

            <div>
              {
                user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)
                  ?.emailAddress
              }
            </div>

            <div>{user.publicMetadata.role as string}</div>

            <form action={setRole}>
              <Input type="hidden" value={user.id} name="id" />
              <Input type="hidden" value="admin" name="role" />
              <Button type="submit">Make Admin</Button>
            </form>

            <form action={setRole}>
              <Input type="hidden" value={user.id} name="id" />
              <Input type="hidden" value="moderator" name="role" />
              <Button type="submit">Make Moderator</Button>
            </form>

            <form action={removeRole}>
              <Input type="hidden" value={user.id} name="id" />
              <Button type="submit">Remove Role</Button>
            </form>
          </div>
        )
      })}
    </div>
  )
}