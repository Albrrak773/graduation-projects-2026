interface Window {
  OneSignalDeferred?: Array<
    (OneSignal: {
      init: (config: Record<string, unknown>) => Promise<void>
      initialized: Promise<void>
      Notifications: { requestPermission: () => Promise<boolean> }
      User: {
        PushSubscription: {
          optedIn: boolean
          optIn: () => Promise<void>
          optOut: () => Promise<void>
          addEventListener: (event: string, callback: () => void) => void
        }
      }
    }) => Promise<void>
  >
}
