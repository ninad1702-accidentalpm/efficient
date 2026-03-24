import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LandingNav } from "./components/landing-nav";
import { LandingHero } from "./components/landing-hero";
import { LandingFooter } from "./components/landing-footer";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/today");
  }

  return (
    <div className="relative min-h-screen bg-[#F9F8F5] font-inter antialiased selection:bg-[#CBA76B] selection:text-white lg:h-screen lg:overflow-hidden flex flex-col">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute right-[-5%] top-[-10%] h-[600px] w-[600px] rounded-full bg-[#EAE8E3]/40 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-[-20%] left-[-10%] h-[800px] w-[800px] rounded-full bg-white/60 blur-[120px]" />

      <LandingNav />
      <LandingHero />
      <LandingFooter />
    </div>
  );
}
