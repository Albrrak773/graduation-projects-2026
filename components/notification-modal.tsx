"use client"

import { IconBell, IconBellRinging } from "@tabler/icons-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useNotification } from "@/components/notification-provider"

function SafariIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="14.5 9.5 9 11 14.5 14.5 12 9" fill="currentColor" opacity="0.3" />
      <path d="M14.5 9.5L9 11l5.5 3.5L12 9z" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
    </svg>
  )
}

function IOSShareIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 11V4" />
      <path d="M8 8l4-4 4 4" />
      <rect x="4" y="14" width="16" height="6" rx="2" />
    </svg>
  )
}

function IOSAddToHomeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M12 8v8m-4-4h8" />
    </svg>
  )
}

export function NotificationModal() {
  const { isSupported, subscription, loading, subscribe, unsubscribe, openModal, setOpenModal, isIOS, isStandalone } =
    useNotification()
  const isIOSNotStandalone = isIOS && !isStandalone

  return (
    <Dialog open={openModal} onOpenChange={setOpenModal}>
      <DialogContent className="max-w-sm rounded-3xl p-6 text-center">
        <DialogHeader>
          <DialogTitle className="flex flex-col items-center gap-3 text-xl">
            {subscription ? (
              <IconBellRinging className="size-9 text-emerald-500" />
            ) : (
              <IconBell className="size-9 text-primary" />
            )}
            {subscription ? "الإشعارات مفعّلة" : "خلّينا نذكّرك بالجديد"}
          </DialogTitle>
          <DialogDescription className="text-sm leading-6">
            {subscription
              ? "بتوصلك أخبار الحفل ومعرض المشاريع أولاً بأول."
              : isIOSNotStandalone
                ? "عشان تستقبل الإشعارات على آيفون، لازم تضيف التطبيق للشاشة الرئيسية أولاً:"
                : isSupported
                  ? "فعّل الإشعارات عشان توصلك أخبار الحفل والمشاريع بدون ما ترجع تدور عليها."
                  : "الإشعارات غير متاحة في هذا المتصفح حالياً."}
          </DialogDescription>
        </DialogHeader>

        {subscription ? (
          <div className="mt-2 flex flex-col gap-3">
            <Button variant="outline" onClick={unsubscribe} disabled={loading} className="w-full rounded-full">
              {loading ? "جاري إلغاء الاشتراك..." : "إلغاء الاشتراك"}
            </Button>
          </div>
        ) : isIOSNotStandalone ? (
          <ol className="mt-4 list-none space-y-3 text-start text-sm leading-6">
            <li className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                1
              </span>
              <span className="flex items-center gap-2">
                افتح الموقع في متصفّح سفاري
                <SafariIcon className="size-5 shrink-0 text-primary" />
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                2
              </span>
              <span className="flex items-center gap-2">
                اضغط على زر المشاركة
                <IOSShareIcon className="size-5 shrink-0 text-primary" />
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                3
              </span>
              <span className="flex items-center gap-2">
                اختر
                <IOSAddToHomeIcon className="size-5 shrink-0 text-primary" />
                {"«إضافة إلى الشاشة الرئيسية»"}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                4
              </span>
              <span>افتح التطبيق من الشاشة الرئيسية وفعّل الإشعارات</span>
            </li>
          </ol>
        ) : isSupported ? (
          <div className="mt-2 flex flex-col gap-3">
            <Button onClick={subscribe} disabled={loading} className="w-full rounded-full font-bold">
              {loading ? "جاري التفعيل..." : "فعّل الإشعارات"}
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
