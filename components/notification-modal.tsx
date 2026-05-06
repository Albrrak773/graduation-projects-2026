"use client"

import { IconBell, IconBellRinging, IconDeviceMobile } from "@tabler/icons-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useNotification } from "@/components/notification-provider"

function InstallPrompt({ isIOS }: { isIOS: boolean }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/40 p-4 text-sm">
      <div className="flex items-center gap-2 text-foreground">
        <span className="flex size-8 items-center justify-center rounded-full border border-border/60 bg-background">
          <IconDeviceMobile className="size-4" />
        </span>
        <span className="font-heading font-bold">التثبيت مطلوب</span>
      </div>
      <p className="text-muted-foreground">الإشعارات تتطلب تثبيت التطبيق على شاشتك الرئيسية.</p>
      {isIOS ? (
        <ol className="list-decimal space-y-1 pe-4 text-muted-foreground">
          <li>
            اضغط على زر <strong>المشاركة</strong> &#x2398; في أسفل سفاري
          </li>
          <li>
            اضغط <strong>إضافة إلى الشاشة الرئيسية</strong> &#x2795;
          </li>
          <li>افتح التطبيق من الشاشة الرئيسية</li>
        </ol>
      ) : (
        <p className="text-muted-foreground">
          سترى رسالة تثبيت تلقائية عند فتح الموقع، أو يمكنك تثبيته من قائمة المتصفح.
        </p>
      )}
    </div>
  )
}

export function NotificationModal() {
  const { isSupported, subscription, isIOS, loading, subscribe, unsubscribe, openModal, setOpenModal } =
    useNotification()

  const statusLabel = isSupported ? (subscription ? "الحالة الحالية: مشترك" : "الحالة الحالية: غير مشترك") : "غير متاح"

  const statusMessage = isSupported
    ? subscription
      ? "أنت مشترك وتستلم الإشعارات."
      : "اشترك عشان تاصلك إشعارات بأحدث الأخبار."
    : "الإشعارات تتطلب تثبيت التطبيق أولًا."

  return (
    <Dialog open={openModal} onOpenChange={setOpenModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {subscription ? (
              <IconBellRinging className="size-5 text-emerald-500" />
            ) : (
              <IconBell className="size-5 text-muted-foreground" />
            )}
            إدارة الإشعارات
          </DialogTitle>
          <DialogDescription>تحكم في اشتراكك، اشترك في الإشعارات أو ألغِ الاشتراك إذا أزعجناك 😉</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
          <span className="text-xs font-semibold text-foreground">{statusLabel}</span>
          <span className="text-xs text-muted-foreground">{statusMessage}</span>
        </div>

        {isSupported ? (
          <div className="flex flex-col gap-3">
            {subscription ? (
              <>
                <div className="flex items-center justify-center gap-2 text-sm text-emerald-600">
                  <span className="relative flex size-2.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
                  </span>
                  مشترك
                </div>
                <Button variant="destructive" onClick={unsubscribe} disabled={loading} className="w-full">
                  {loading ? "جارٍ إلغاء الاشتراك..." : "إلغاء الاشتراك"}
                </Button>
              </>
            ) : (
              <Button onClick={subscribe} disabled={loading} className="w-full">
                {loading ? "جارٍ الاشتراك..." : "اشتراك"}
              </Button>
            )}
          </div>
        ) : (
          <InstallPrompt isIOS={isIOS} />
        )}
      </DialogContent>
    </Dialog>
  )
}
