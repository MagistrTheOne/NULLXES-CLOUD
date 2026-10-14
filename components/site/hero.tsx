import { Cpu, Globe, Server, ShieldCheck } from "lucide-react";

const FEATURES = [
  { Icon: Cpu, t: "GPU / CPU", d: "Compute for demanding workloads" },
  { Icon: Server, t: "Cluster concepts", d: "Multi-node configurations" },
  { Icon: ShieldCheck, t: "Built for scale", d: "Flexible infrastructure options" },
  { Icon: Globe, t: "Built for AI", d: "Research and robotics workloads" },
];

export function Hero() {
  return (
    <header className="relative min-h-[470px] overflow-hidden border-b border-line">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/cluster.png" alt="" aria-hidden className="absolute inset-y-0 right-0 h-full w-full object-cover object-right opacity-80 [mask-image:linear-gradient(90deg,transparent_5%,#000_55%)] sm:w-[68%] sm:opacity-100" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/[.06] to-transparent" />
      <div className="absolute bottom-11 right-10 hidden text-[9.5px] leading-[1.9] tracking-[.2em] text-faint xl:block">AI<br />ROBOTICS<br />RESEARCH<br />PRODUCTION</div>

      <div className="relative z-10 mx-auto max-w-[1280px] px-5 pb-10 pt-20 sm:px-10">
        <p className="text-[10px] tracking-[.3em] text-faint">SCALABLE INFRASTRUCTURE</p>
        <h1 className="mb-5 mt-5 animate-[rise_1.2s_ease_both] bg-gradient-to-b from-white from-40% to-[#9a9a9f] bg-clip-text font-display text-[clamp(40px,6.2vw,76px)] leading-[1.05] text-transparent">
          NULLXES <span className="opacity-80">CLOUD</span>
        </h1>
        <p className="max-w-[520px] text-[clamp(17px,2vw,22px)] font-light leading-snug text-[#cfcfd2]">GPU / CPU infrastructure for AI, robotics and next generation workloads.</p>
        <div className="mt-16 flex flex-wrap gap-x-9 gap-y-5">
          {FEATURES.map(({ Icon, t, d }) => (
            <div key={t} className="flex max-w-[175px] items-center gap-3">
              <span className="grid size-[34px] flex-none place-items-center rounded-full border border-border"><Icon className="size-[15px] text-[#d9dadd]" strokeWidth={1.4} /></span>
              <div><b className="block text-[11.5px] font-medium">{t}</b><small className="block text-[10px] leading-snug text-faint">{d}</small></div>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
