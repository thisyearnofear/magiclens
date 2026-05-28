import React from "react";
import { Timegroup, Text, Image } from "@editframe/react";

export const Video = () => {
  return (
    <Timegroup
      workbench
      className="w-[1920px] h-[1080px] bg-black relative overflow-hidden"
      mode="sequence"
      overlap="0.5s"
    >
      {/* ── SCENE 0: Logo Reveal ── */}
      <Timegroup
        mode="fixed"
        duration="3s"
        className="absolute w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 30% 50%, #1a0a2e 0%, transparent 50%), radial-gradient(ellipse at 70% 50%, #0a1a2e 0%, transparent 50%)",
            animation: "3s bg-sweep 0s",
          }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              "conic-gradient(from 0deg at 50% 50%, #1a0a2e, #000, #0a1a2e, #000, #1a0a2e)",
            animation: "3s bg-spin 0s",
          }}
        />
        <Image
          src="/assets/magiclens.png"
          duration="3s"
          className="relative w-[240px] h-[240px] object-contain z-10"
          style={{
            animation: "3s logo-scale 0s",
          }}
        />
        <Text
          duration="3s"
          split="word"
          stagger="100ms"
          className="relative text-white text-6xl font-bold mt-8 z-10 tracking-tight"
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          The AR Remix Layer for Live Sports
        </Text>
      </Timegroup>

      {/* ── SCENE 1: Pick a Moment ── */}
      <Timegroup
        mode="fixed"
        duration="3s"
        className="absolute w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 20% 60%, #1e0a3c 0%, transparent 55%), radial-gradient(ellipse at 80% 30%, #3c0a1e 0%, transparent 55%)",
            animation: "3s bg-drift 0s",
          }}
        />
        <div
          className="absolute inset-0 opacity-15"
          style={{
            background:
              "conic-gradient(from 120deg at 50% 50%, #1e0a3c, #000, #3c0a1e, #000, #1e0a3c)",
            animation: "3s bg-spin-reverse 0s",
          }}
        />
        <Image
          src="/assets/flag-argentina.svg"
          duration="3s"
          className="absolute w-[180px] h-[120px] object-contain opacity-25"
          style={{ top: "12%", left: "8%", animation: "3s float-fast 0s" }}
        />
        <Image
          src="/assets/flag-brazil.svg"
          duration="3s"
          className="absolute w-[180px] h-[120px] object-contain opacity-25"
          style={{ top: "12%", right: "8%", animation: "3s float-fast 0.2s" }}
        />
        <Image
          src="/assets/flag-france.svg"
          duration="3s"
          className="absolute w-[150px] h-[100px] object-contain opacity-20"
          style={{ bottom: "18%", left: "12%", animation: "3s float-fast 0.4s" }}
        />
        <Image
          src="/assets/flag-germany.svg"
          duration="3s"
          className="absolute w-[150px] h-[100px] object-contain opacity-20"
          style={{ bottom: "18%", right: "12%", animation: "3s float-fast 0.6s" }}
        />
        <Text
          duration="3s"
          split="char"
          stagger="30ms"
          easing="ease-out"
          className="relative text-white text-8xl font-extrabold mb-4 z-10 tracking-tighter"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          CHOOSE YOUR MOMENT
        </Text>
        <Text
          duration="3s"
          split="word"
          stagger="80ms"
          className="relative text-white/70 text-3xl z-10"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          Pick a World Cup clip. Pose tracking finds the action.
        </Text>
      </Timegroup>

      {/* ── SCENE 2: Drop AR Overlays ── */}
      <Timegroup
        mode="fixed"
        duration="3s"
        className="absolute w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 40% 50%, #2a0a1e 0%, transparent 55%), radial-gradient(ellipse at 60% 60%, #1e0a2a 0%, transparent 55%)",
            animation: "3s bg-drift 0s",
          }}
        />
        <Image
          src="/assets/confetti-burst.svg"
          duration="3s"
          className="absolute w-[300px] h-[300px] object-contain opacity-30"
          style={{ top: "8%", left: "5%", animation: "3s rotate-faster 0s" }}
        />
        <Image
          src="/assets/confetti-burst.svg"
          duration="3s"
          className="absolute w-[250px] h-[250px] object-contain opacity-25"
          style={{ top: "8%", right: "5%", animation: "3s rotate-faster 0.5s" }}
        />
        <Image
          src="/assets/flag-halo.svg"
          duration="3s"
          className="absolute w-[220px] h-[140px] object-contain opacity-35"
          style={{ bottom: "10%", left: "15%", animation: "3s float-fast 0s" }}
        />
        <Image
          src="/assets/goal-banner.svg"
          duration="3s"
          className="absolute w-[280px] h-[100px] object-contain opacity-35"
          style={{ bottom: "10%", right: "10%", animation: "3s float-fast 0.3s" }}
        />
        <Text
          duration="3s"
          split="char"
          stagger="25ms"
          easing="ease-out"
          className="relative text-white text-8xl font-extrabold mb-4 z-10 tracking-tighter"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          DROP AR OVERLAYS
        </Text>
        <Text
          duration="3s"
          split="word"
          stagger="80ms"
          className="relative text-white/70 text-3xl z-10"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          Flag halos. Confetti. GOAL! banners. Pose-aware effects.
        </Text>
      </Timegroup>

      {/* ── SCENE 3: Mint & Earn ── */}
      <Timegroup
        mode="fixed"
        duration="3s"
        className="absolute w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 30% 40%, #0a2a1e 0%, transparent 55%), radial-gradient(ellipse at 70% 70%, #1e2a0a 0%, transparent 55%)",
            animation: "3s bg-sweep 0s",
          }}
        />
        <Image
          src="/assets/sparkle-particle.svg"
          duration="3s"
          className="absolute w-[200px] h-[200px] object-contain opacity-35"
          style={{ top: "10%", left: "10%", animation: "3s rotate-faster 0s" }}
        />
        <Image
          src="/assets/sparkle-particle.svg"
          duration="3s"
          className="absolute w-[160px] h-[160px] object-contain opacity-30"
          style={{ bottom: "12%", right: "12%", animation: "3s rotate-faster 0.8s" }}
        />
        <Text
          duration="3s"
          split="char"
          stagger="25ms"
          easing="ease-out"
          className="relative text-green-400 text-8xl font-extrabold mb-4 z-10 tracking-tighter"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          MINT. EARN. CLIMB.
        </Text>
        <Text
          duration="3s"
          split="word"
          stagger="80ms"
          className="relative text-white/70 text-3xl z-10"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          Mint your remix as an NFT. Climb the daily leaderboard.
        </Text>
      </Timegroup>

      {/* ── SCENE 4: Dual Chain ── */}
      <Timegroup
        mode="fixed"
        duration="3s"
        className="absolute w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 20%, #0a1a2e 0%, transparent 55%), radial-gradient(ellipse at 50% 80%, #1e0a2e 0%, transparent 55%)",
            animation: "3s bg-sweep 0s",
          }}
        />
        <div
          className="absolute inset-0 opacity-12"
          style={{
            background:
              "conic-gradient(from 240deg at 50% 50%, #0a1a2e, #000, #0a2e1a, #000, #0a1a2e)",
            animation: "3s bg-spin 0s",
          }}
        />
        <Text
          duration="3s"
          split="char"
          stagger="30ms"
          easing="ease-out"
          className="relative text-cyan-400 text-7xl font-extrabold mb-2 z-10 tracking-tighter"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          X LAYER
        </Text>
        <Text
          duration="3s"
          className="relative text-white/40 text-4xl font-bold z-10 mb-1"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          +
        </Text>
        <Text
          duration="3s"
          split="char"
          stagger="30ms"
          easing="ease-out"
          className="relative text-emerald-400 text-7xl font-extrabold mb-5 z-10 tracking-tighter"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          FLOW
        </Text>
        <Text
          duration="3s"
          split="word"
          stagger="80ms"
          className="relative text-white/60 text-2xl z-10"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          Two chains. One app. Seamless UX. Top-3 become Iconic Moments.
        </Text>
      </Timegroup>

      {/* ── SCENE 5: Stats / Social Proof ── */}
      <Timegroup
        mode="fixed"
        duration="3s"
        className="absolute w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 30% 40%, #1e0a0a 0%, transparent 55%), radial-gradient(ellipse at 70% 60%, #0a0a1e 0%, transparent 55%)",
            animation: "3s bg-drift 0s",
          }}
        />
        <div className="relative z-10 flex gap-16 mb-8">
          <div className="flex flex-col items-center">
            <Text
              duration="3s"
              className="text-white text-7xl font-extrabold tracking-tighter"
              style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
            >
              8
            </Text>
            <Text
              duration="3s"
              className="text-white/60 text-2xl mt-1"
              style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
            >
              Iconic Moments
            </Text>
          </div>
          <div className="flex flex-col items-center">
            <Text
              duration="3s"
              className="text-white text-7xl font-extrabold tracking-tighter"
              style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
            >
              6
            </Text>
            <Text
              duration="3s"
              className="text-white/60 text-2xl mt-1"
              style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
            >
              Smart Contracts
            </Text>
          </div>
          <div className="flex flex-col items-center">
            <Text
              duration="3s"
              className="text-white text-7xl font-extrabold tracking-tighter"
              style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
            >
              5
            </Text>
            <Text
              duration="3s"
              className="text-white/60 text-2xl mt-1"
              style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
            >
              Overlay Packs
            </Text>
          </div>
        </div>
        <Text
          duration="3s"
          split="word"
          stagger="60ms"
          className="relative text-white/50 text-xl z-10"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          Live on X Layer testnet & Flow testnet
        </Text>
      </Timegroup>

      {/* ── SCENE 6: World Cup + CTA ── */}
      <Timegroup
        mode="fixed"
        duration="3s"
        className="absolute w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 30%, #2e1a0a 0%, transparent 55%), radial-gradient(ellipse at 50% 70%, #2e0a1a 0%, transparent 55%)",
            animation: "3s bg-sweep 0s",
          }}
        />
        <div
          className="absolute inset-0 opacity-15"
          style={{
            background:
              "conic-gradient(from 0deg at 50% 50%, #2e1a0a, #000, #2e0a1a, #000, #2e1a0a)",
            animation: "3s bg-spin-reverse 0s",
          }}
        />
        <Image
          src="/assets/confetti-burst.svg"
          duration="3s"
          className="absolute w-[400px] h-[400px] object-contain opacity-25"
          style={{ top: "5%", left: "5%", animation: "3s rotate-faster 0s" }}
        />
        <Image
          src="/assets/confetti-burst.svg"
          duration="3s"
          className="absolute w-[350px] h-[350px] object-contain opacity-20"
          style={{ top: "5%", right: "5%", animation: "3s rotate-faster 0.7s" }}
        />
        <Text
          duration="3s"
          split="char"
          stagger="22ms"
          easing="ease-out"
          className="relative text-white text-8xl font-extrabold mb-3 z-10 tracking-tighter"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          FIFA WORLD CUP 2026
        </Text>
        <Text
          duration="3s"
          split="word"
          stagger="70ms"
          className="relative text-amber-400 text-3xl font-semibold mb-4 z-10"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          Next: Wimbledon . NBA Finals . F1 . Olympics LA 2028
        </Text>
        <Text
          duration="3s"
          split="word"
          stagger="80ms"
          className="relative text-white/80 text-4xl font-bold z-10 mt-4"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          magiclens.vercel.app
        </Text>
      </Timegroup>
    </Timegroup>
  );
};
