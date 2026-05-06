"use client"

import { IconBell, IconBellRinging } from "@tabler/icons-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useNotification } from "@/components/notification-provider"

function InstallPrompt({ isIOS }: { isIOS: boolean }) {
  return (
    <div className="rounded-lg border bg-muted/50 p-4 text-sm">
      <p className="font-heading font-bold">التثبيت مطلوب</p>
      <p className="mt-1 text-muted-foreground">الإشعارات تتطلب تثبيت التطبيق على شاشتك الرئيسية.</p>
      {isIOS ? (
        <ol className="mt-3 list-decimal space-y-1 pe-4 text-muted-foreground">
          <li>
            اضغط على زر <strong>المشاركة</strong> &#x2398; في أسفل سفاري
          </li>
          <li>
            اضغط <strong>إضافة إلى الشاشة الرئيسية</strong> &#x2795;
          </li>
          <li>افتح التطبيق من الشاشة الرئيسية</li>
        </ol>
      ) : (
        <p className="mt-2 text-muted-foreground">
          سترى رسالة تثبيت تلقائية عند فتح الموقع، أو يمكنك تثبيته من قائمة المتصفح.
        </p>
      )}
    </div>
  )
}

export function NotificationModal() {
  const { isSupported, subscription, isIOS, loading, subscribe, unsubscribe, openModal, setOpenModal } =
    useNotification()

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
            الإشعارات
          </DialogTitle>
          <DialogDescription>
            {isSupported
              ? subscription
                ? "أنت مشترك وتستلم الإشعارات."
                : "اشترك لتستلم إشعارات بأحدث الأخبار."
              : "الإشعارات تتطلب تثبيت التطبيق أولًا."}
          </DialogDescription>
        </DialogHeader>

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
