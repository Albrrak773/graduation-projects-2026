"use client"

import { IconBell, IconBellRinging } from "@tabler/icons-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useNotification } from "@/components/notification-provider"

export function NotificationModal() {
  const { isSupported, subscription, loading, subscribe, unsubscribe, openModal, setOpenModal } = useNotification()

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
              : isSupported
                ? "فعّل الإشعارات عشان توصلك أخبار الحفل والمشاريع بدون ما ترجع تدور عليها."
                : "الإشعارات غير متاحة في هذا المتصفح حالياً."}
          </DialogDescription>
        </DialogHeader>

        {isSupported ? (
          <div className="mt-2 flex flex-col gap-3">
            {subscription ? (
              <Button variant="outline" onClick={unsubscribe} disabled={loading} className="w-full rounded-full">
                {loading ? "جاري إلغاء الاشتراك..." : "إلغاء الاشتراك"}
              </Button>
            ) : (
              <Button onClick={subscribe} disabled={loading} className="w-full rounded-full font-bold">
                {loading ? "جاري التفعيل..." : "فعّل الإشعارات"}
              </Button>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
