"use client";

import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { modules } from "@/content/modules";
import { servoraApps } from "@/lib/servora-apps";
import { track } from "@/lib/analytics";

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [appsOpen, setAppsOpen] = useState(false);
  const productRef = useRef<HTMLDivElement>(null);
  const appsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (productRef.current && !productRef.current.contains(event.target as Node)) setProductOpen(false);
      if (appsRef.current && !appsRef.current.contains(event.target as Node)) setAppsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProductOpen(false);
        setAppsOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const closeMenus = () => { setMobileOpen(false); setProductOpen(false); setAppsOpen(false); };

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[color:var(--surface)]/95 backdrop-blur">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[var(--primary)] focus:px-4 focus:py-2 focus:text-white">Skip to content</a>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link href="/" onClick={closeMenus} className="text-xl font-bold tracking-tight" aria-label="Servora home">servora<span className="text-[var(--primary)]">.</span></Link>
        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary navigation">
          <div ref={productRef} className="relative">
            <div className="flex items-center gap-1">
              <Link href="/product" className="text-sm font-medium">Product</Link>
              <button type="button" className="rounded p-1 hover:bg-[var(--surface-secondary)]" onClick={() => setProductOpen(value => !value)} aria-expanded={productOpen} aria-controls="product-menu" aria-label="Toggle Product menu"><ChevronDown size={15} aria-hidden="true" /></button>
            </div>
            {productOpen && <div id="product-menu" className="absolute left-1/2 top-full w-[700px] -translate-x-1/2 pt-4" role="menu"><div className="grid grid-cols-2 gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-md)]">{modules.map(item => <Link key={item.slug} href={`/product/${item.slug}`} onClick={closeMenus} role="menuitem" className="rounded-xl p-3 hover:bg-[var(--primary-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"><span className="block text-sm font-semibold">{item.name}</span><span className="mt-1 block text-xs text-[var(--text-secondary)]">{item.description}</span></Link>)}</div></div>}
          </div>
          <div ref={appsRef} className="relative">
            <div className="flex items-center gap-1">
              <Link href="/apps" className="text-sm font-medium">Apps</Link>
              <button type="button" className="rounded p-1 hover:bg-[var(--surface-secondary)]" onClick={() => setAppsOpen(value => !value)} aria-expanded={appsOpen} aria-controls="apps-menu" aria-label="Toggle Apps menu"><ChevronDown size={15} aria-hidden="true" /></button>
            </div>
            {appsOpen && <div id="apps-menu" className="absolute left-1/2 top-full w-[420px] -translate-x-1/2 pt-4" role="menu"><div className="grid gap-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-md)]">{servoraApps.map(app => { const Icon = app.icon; return <a key={app.key} href={app.href} onClick={closeMenus} role="menuitem" className="flex gap-3 rounded-xl p-3 hover:bg-[var(--primary-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"><span className="mt-0.5 rounded-lg bg-[var(--primary-surface)] p-2 text-[var(--primary)]"><Icon size={17} aria-hidden="true" /></span><span><span className="block text-sm font-semibold">{app.name}</span><span className="mt-0.5 block text-xs leading-5 text-[var(--text-secondary)]">{app.description}</span></span></a>; })}</div></div>}
          </div>
          <Link href="/pricing" className="text-sm font-medium">Pricing</Link>
          <Link href="/contact" className="text-sm font-medium">Contact</Link>
          <Link href="/login" className="text-sm font-medium">Sign In</Link>
          <Link onClick={() => track({ event: "nav_cta_click", location: "header" })} href="/book-a-demo" className="rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2">Book a Demo</Link>
        </nav>
        <button type="button" className="rounded-lg p-2 hover:bg-[var(--surface-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] md:hidden" onClick={() => setMobileOpen(value => !value)} aria-expanded={mobileOpen} aria-controls="mobile-nav" aria-label={mobileOpen ? "Close navigation" : "Open navigation"}>{mobileOpen ? <X size={22}/> : <Menu size={22}/>}</button>
      </div>
      {mobileOpen && <nav id="mobile-nav" className="border-t border-[var(--border)] bg-[var(--surface)] px-6 py-5 md:hidden" aria-label="Mobile navigation"><div className="grid gap-1"><Link onClick={closeMenus} href="/product" className="rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-[var(--primary-surface)]">Product overview</Link>{modules.map(item => <Link onClick={closeMenus} key={item.slug} href={`/product/${item.slug}`} className="rounded-lg px-3 py-2.5 pl-6 text-sm text-[var(--text-secondary)] hover:bg-[var(--primary-surface)] hover:text-[var(--text-primary)]">{item.name}</Link>)}<div className="my-2 border-t border-[var(--border)]" /><Link onClick={closeMenus} href="/apps" className="rounded-lg px-3 py-2.5 text-sm font-semibold">Servora Apps</Link>{servoraApps.map(app => <a onClick={closeMenus} key={app.key} href={app.href} className="rounded-lg px-3 py-2.5 pl-6 text-sm text-[var(--text-secondary)] hover:bg-[var(--primary-surface)] hover:text-[var(--text-primary)]">{app.name}</a>)}<div className="my-2 border-t border-[var(--border)]" /><Link onClick={closeMenus} href="/pricing" className="rounded-lg px-3 py-2.5 text-sm font-medium">Pricing</Link><Link onClick={closeMenus} href="/contact" className="rounded-lg px-3 py-2.5 text-sm font-medium">Contact</Link><Link onClick={closeMenus} href="/login" className="rounded-lg px-3 py-2.5 text-sm font-medium">Sign In</Link><Link onClick={() => { track({ event: "nav_cta_click", location: "header" }); closeMenus(); }} href="/book-a-demo" className="mt-2 rounded-lg bg-[var(--primary)] px-4 py-3 text-center text-sm font-semibold text-white">Book a Demo</Link></div></nav>}
    </header>
  );
}
