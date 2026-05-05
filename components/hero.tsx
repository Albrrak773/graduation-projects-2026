import Image from "next/image"

export function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center px-6 pt-20 pb-16 md:pt-32 md:pb-20">
      <Image
        src="/design/logo.png"
        alt="مشاريع التخرج"
        className="w-full max-w-md md:max-w-lg"
        width={480}
        height={200}
        priority
      />
    </section>
  )
}
