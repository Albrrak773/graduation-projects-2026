"use client"

import Image from "next/image"
import { IconBrandGithub, IconBrandGithubFilled, IconBrandX, IconBrandXFilled } from "@tabler/icons-react"
import { TEAM_MEMBERS } from "@/lib/team-members"
import { SocialIconLink } from "@/components/social-icon-link"
import { Button } from "@/components/ui/button"
import { OPEN_NOTIFICATIONS_DRAWER_EVENT } from "@/components/notifications/notification-events"

export function Footer() {
  function handleOpenNotifications() {
    if (typeof window === "undefined") return
    window.dispatchEvent(new Event(OPEN_NOTIFICATIONS_DRAWER_EVENT))
  }

  return (
    <footer className="relative mt-16 border-t border-border bg-card">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-6 py-12 md:py-16">
        <div className="flex flex-col items-center gap-6">
          <Image src="/design/logo.png" alt="مشاريع التخرج" className="h-20 w-auto md:h-24" width={200} height={80} />

          <p className="text-sm text-muted-foreground md:text-base">صُنع بحب بواسطة</p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {TEAM_MEMBERS.map((member) => (
              <div key={member.name} className="flex items-center gap-2">
                <span className="font-heading text-sm font-bold text-foreground md:text-base">{member.name}</span>
                <div className="flex items-center gap-1.5">
                  <SocialIconLink
                    href={member.github}
                    label={`${member.name} GitHub`}
                    brand="github"
                    icon={<IconBrandGithub className="size-4" />}
                    filledIcon={<IconBrandGithubFilled className="size-4" />}
                  />
                  <SocialIconLink
                    href={member.x}
                    label={`${member.name} X`}
                    brand="x"
                    icon={<IconBrandX className="size-4" />}
                    filledIcon={<IconBrandXFilled className="size-4" />}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button size="sm" variant="outline" onClick={handleOpenNotifications}>
          إدارة الإشعارات
        </Button>
      </div>
      <div className="flex justify-center"></div>
    </footer>
  )
}
