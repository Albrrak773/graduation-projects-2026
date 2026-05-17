"use client"

import Image from "next/image"
import Link from "next/link"
import {
  IconBell,
  IconBrandGithub,
  IconBrandGithubFilled,
  IconBrandLinkedin,
  IconBrandLinkedinFilled,
  IconUser,
  IconX,
  IconBrandX,
  IconBrandXFilled,
} from "@tabler/icons-react"
import { useUser, useClerk } from "@clerk/nextjs"
import { TEAM_MEMBERS } from "@/lib/team-members"
import { SocialIconLink } from "@/components/social-icon-link"
import { Button } from "@/components/ui/button"
import { useNotification } from "@/components/notification-provider"

export function Footer() {
  const { setOpenModal } = useNotification()
  const { isSignedIn } = useUser()
  const { openSignIn } = useClerk()

  return (
    <footer className="relative mt-16 border-t border-border bg-card">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-6 py-12 md:py-16">
        <div className="flex flex-col items-center gap-6">
          <Image
            src="/design/logo.png"
            alt="مشاريع التخرج"
            className="h-20 w-auto md:h-24"
            width={200}
            height={80}
            style={{ width: "auto" }}
          />

          <div className="flex flex-col items-center gap-4">
            {TEAM_MEMBERS.map((member) => (
              <div key={member.name} className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground md:text-base">{member.role}:</span>
                <span className="font-heading text-sm font-bold text-foreground md:text-base">{member.name}</span>
                <div className="flex items-center gap-1.5">
                  {"github" in member && (
                    <SocialIconLink
                      href={member.github}
                      label={`${member.name} GitHub`}
                      brand="github"
                      icon={<IconBrandGithub className="size-4" />}
                      filledIcon={<IconBrandGithubFilled className="size-4" />}
                    />
                  )}
                  {"linkedin" in member && (
                    <SocialIconLink
                      href={member.linkedin}
                      label={`${member.name} LinkedIn`}
                      brand="linkedin"
                      icon={<IconBrandLinkedin className="size-4" />}
                      filledIcon={<IconBrandLinkedinFilled className="size-4" />}
                    />
                  )}
                  <SocialIconLink
                    href={member.x}
                    label={`${member.name} X`}
                    brand="x"
                    icon={<IconX className="size-4" />}
                    filledIcon={<IconBrandXFilled className="size-4" />}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setOpenModal(true)} className="gap-2">
            <IconBell className="size-4" />
            فعل الإشعارات
          </Button>
          {isSignedIn ? (
            <Link
              href="/profile"
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <IconUser className="size-4" />
              حسابي
            </Link>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => openSignIn()} className="gap-2 text-muted-foreground">
              <IconUser className="size-4" />
              تسجيل الدخول
            </Button>
          )}
          <a
            href="https://cooperative-armadillo-c63.notion.site/3568fdd5c8d780e39264e75dac911b55?source=copy_link"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground"
          >
            تفاصيل تقنية للنيردات
          </a>
        </div>
      </div>
    </footer>
  )
}
