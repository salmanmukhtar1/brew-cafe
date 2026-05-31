"use client";

import { supabase } from './supabaseClient';
import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ShoppingBag, Plus, Minus, Trash2, X, MapPin, Lock, ChefHat, LayoutDashboard,
  Database, Bot, TrendingUp, PlusCircle, Search, Clock3, ShieldCheck, BellRing,
  PanelLeftClose, PanelLeftOpen, Settings, Receipt, LogOut, Calendar, Check,
  DollarSign, Zap, Cpu, Smartphone, RotateCcw, Timer, Eye, Wifi, RefreshCw,
  HelpCircle, Upload, Banknote, Printer, AlertTriangle, CheckCircle2,
  Navigation, ChevronLeft, ChevronRight, Megaphone, Sparkles, Star, Moon,
  Globe, Crown,
} from "lucide-react";

/* =========================================================
   TYPE DEFINITIONS
========================================================= */
interface LocalizedString { en: string; ar: string; }
interface MenuItem {
  id: number; badge: string; type: string;
  name: LocalizedString; desc: LocalizedString;
  price: number; kcal: number; cat: string; sold: number; img: string; inStock: boolean;
}
interface CartItem extends MenuItem { qty: number; }
interface OrderItem { name: string; qty: number; }
type PaymentMethod = "cash" | "online";
type PaymentStatus = "pending" | "paid" | "refunded";
interface Order {
  id: number; customer: string; phone: string;
  method: "pickup" | "delivery";
  items: OrderItem[]; total: number; status: string;
  created_at: number; notes: string; previousStatus: string | null;
  paymentMethod: PaymentMethod; paymentStatus: PaymentStatus;
  deliveryAddress?: string; deliveryArea?: string; deliveryLandmark?: string;
}
interface CustomerInfo {
  name: string; phone: string; method: "pickup" | "delivery"; notes: string;
  paymentMethod: PaymentMethod;
  deliveryAddress: string; deliveryArea: string; deliveryLandmark: string;
}
interface IslamicEvent {
  id: string; name: LocalizedString; date: string; sticker: string;
  desc: LocalizedString; color: string;
}
interface NewListingState {
  nameEn: string; nameAr: string; descEn: string; descAr: string;
  price: string; kcal: string; cat: string; badge: string; imgUrl: string;
}
interface ToastMessage { id: number; text: string; type: "success" | "error" | "info"; }
interface PromoBlock {
  id: string; type: "banner" | "announcement" | "highlight";
  titleEn: string; titleAr: string; bodyEn: string; bodyAr: string;
  emoji: string; active: boolean; ctaEn: string; ctaAr: string;
  ctaUrl: string; bgColor: string;
}

/* =========================================================
   DEFAULT PROMO
========================================================= */
const DEFAULT_PROMO: PromoBlock = {
  id: "promo_1", type: "banner",
  titleEn: "This Week's Special", titleAr: "عرض هذا الأسبوع",
  bodyEn: "Try our limited edition seasonal drinks — crafted fresh every day.",
  bodyAr: "جرّب مشروباتنا الموسمية المحدودة — تُحضَّر طازجة كل يوم.",
  emoji: "✨", active: false,
  ctaEn: "Order Now", ctaAr: "اطلب الآن", ctaUrl: "", bgColor: "#800020",
};

/* =========================================================
   INITIAL MENU
========================================================= */
const INITIAL_MENU: MenuItem[] = [
  {
    id: 1, badge: "Bestseller", type: "dessert",
    name: { en: "Chocolate Cake", ar: "شوكليت كيك" },
    desc: { en: "Rich and moist chocolate cake layered with intense chocolate flavor.", ar: "كيكة شوكليت غنية وناعمة بطبقات لذيذة من الشوكليت المكثفة." },
    price: 26, kcal: 687, cat: "Dessert", sold: 0,
    img: "https://i.ibb.co/C5h4pwWp/DSC03598.jpg", inStock: true,
  },
  {
    id: 2, badge: "Bestseller", type: "dessert",
    name: { en: "Brownie", ar: "براونيه" },
    desc: { en: "Dense chocolate brownie with a soft fudgy center.", ar: "براوني شوكليت كثيف بقوام طري من الداخل." },
    price: 9, kcal: 150, cat: "Dessert", sold: 0,
    img: "https://i.ibb.co/1fjCWLkp/DSC03628.jpg", inStock: true,
  },
  {
    id: 3, badge: "New", type: "Cold",
    name: { en: "Iced Spanish Latte", ar: "ماتشا سبانش" },
    desc: { en: "Creamy matcha blended with sweet milk in a rich Spanish latte style.", ar: "ماتشا كريمية ممزوجة بالحليب المحلى بأسلوب سبانش فاخر." },
    price: 20, kcal: 225, cat: "cold", sold: 0,
    img: "https://i.ibb.co/hRyLJCg1/DSC05617.jpg", inStock: true,
  },
];



const ORDER_STATUSES = ["Queued", "Preparing", "Ready", "Cancelled", "Delivered"];

const COLORS = [
  "from-[#040209] via-[#0d091a] to-[#180720]",
  "from-[#020202] via-[#14070f] to-[#240118]",
  "from-[#010605] via-[#0a1712] to-[#031c0e]",
];

/* =========================================================
   ISLAMIC EVENTS
========================================================= */
const ISLAMIC_EVENTS: IslamicEvent[] = [
  { id: "ramadan", name: { en: "Ramadan Kareem", ar: "رمضان الكريم" }, date: "05-09", sticker: "🌙", desc: { en: "The Holy Month of Fasting, Prayer & Reflection", ar: "شهر الخير والبركات والعبادة والتقوى" }, color: "from-[#110022] via-[#030008] to-[#000511]" },
  { id: "eid_fitr", name: { en: "Eid Al-Fitr", ar: "عيد الفطر المبارك" }, date: "10-01", sticker: "🎊", desc: { en: "Celebration of Breaking the Fast — Eid Mubarak!", ar: "عساكم من عواده — كل عام وأنتم بخير" }, color: "from-[#001a0a] via-[#020703] to-black" },
  { id: "eid_adha", name: { en: "Eid Al-Adha", ar: "عيد الأضحى المبارك" }, date: "12-10", sticker: "🕋", desc: { en: "Festival of Sacrifice — May Allah accept your deeds", ar: "حفل الأضحى المبارك — تقبّل الله طاعتكم" }, color: "from-[#221400] via-black to-[#110a00]" },
  { id: "saudi_national_day", name: { en: "Saudi National Day 96", ar: "اليوم الوطني السعودي ٩٦" }, date: "09-23", sticker: "🇸🇦", desc: { en: "We Dream & Achieve — 96th National Day", ar: "همة حتى القمة — ٢٣ سبتمبر" }, color: "from-[#001a0e] via-[#010805] to-black" },
];

interface EventMeta {
  gradient: string; glowColor: string; accentColor: string;
  particleEmoji: string[]; bgPattern: string;
  headerEn: string; headerAr: string; subEn: string; subAr: string;
  badgeEn: string; badgeAr: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const EVENT_META: Record<string, EventMeta> = {
  ramadan: { gradient: "linear-gradient(135deg,#0a0020 0%,#1a0040 30%,#000820 60%,#050015 100%)", glowColor: "#6b21a8", accentColor: "#c084fc", particleEmoji: ["🌙","⭐","✨","🌟","💫"], bgPattern: "radial-gradient(ellipse at 20% 20%,#6b21a860 0%,transparent 50%),radial-gradient(ellipse at 80% 80%,#1e3a5f40 0%,transparent 50%)", headerEn: "Ramadan Kareem", headerAr: "رمضان كريم", subEn: "May this holy month fill your heart with peace, blessings & light", subAr: "رمضان شهر الخير والبركة والنور — كل عام وأنتم بخير", badgeEn: "Holy Month", badgeAr: "الشهر المبارك", icon: Moon },
  eid_fitr: { gradient: "linear-gradient(135deg,#001a0e 0%,#003320 30%,#001208 60%,#000f05 100%)", glowColor: "#16a34a", accentColor: "#4ade80", particleEmoji: ["🎊","🎉","✨","🌸","🍬"], bgPattern: "radial-gradient(ellipse at 30% 30%,#16a34a50 0%,transparent 55%),radial-gradient(ellipse at 70% 70%,#ca8a0430 0%,transparent 50%)", headerEn: "Eid Mubarak", headerAr: "عيد مبارك", subEn: "Wishing you and your family a joyful and blessed Eid Al-Fitr", subAr: "عساكم من عواده — كل عام وأنتم بخير وعافية", badgeEn: "Eid Al-Fitr", badgeAr: "عيد الفطر", icon: Star },
  eid_adha: { gradient: "linear-gradient(135deg,#1a0e00 0%,#2d1a00 30%,#0f0800 60%,#1a0800 100%)", glowColor: "#b45309", accentColor: "#fbbf24", particleEmoji: ["🕋","🌙","✨","🐑","🤲"], bgPattern: "radial-gradient(ellipse at 25% 25%,#b4530940 0%,transparent 55%),radial-gradient(ellipse at 75% 75%,#78350f30 0%,transparent 50%)", headerEn: "Eid Al-Adha Mubarak", headerAr: "عيد الأضحى المبارك", subEn: "May Allah accept your sacrifice and grant you His infinite blessings", subAr: "تقبّل الله طاعتكم وأدامكم بصحة وعافية", badgeEn: "Eid Al-Adha", badgeAr: "عيد الأضحى", icon: Globe },
  saudi_national_day: { gradient: "linear-gradient(135deg,#001a0e 0%,#002d18 30%,#000f08 60%,#001a0a 100%)", glowColor: "#15803d", accentColor: "#4ade80", particleEmoji: ["🇸🇦","🌴","⭐","✨","👑"], bgPattern: "radial-gradient(ellipse at 20% 40%,#15803d50 0%,transparent 55%),radial-gradient(ellipse at 80% 60%,#15803d30 0%,transparent 50%)", headerEn: "Saudi National Day", headerAr: "اليوم الوطني السعودي", subEn: "96 years of Vision, Pride & Achievement — We Dream & We Achieve", subAr: "٩٦ عاماً من الإنجاز والطموح — همة حتى القمة", badgeEn: "September 23", badgeAr: "٢٣ سبتمبر", icon: Crown },
};

/* =========================================================
   VALIDATION HELPERS
========================================================= */
const isValidPhone = (p: string) => /^[0-9+\s\-]{7,15}$/.test(p.trim());
const isValidName = (n: string) => n.trim().length >= 2;
const isValidPrice = (p: string) => parseFloat(p) > 0 && isFinite(parseFloat(p));
const isValidKcal = (k: string) => k === "" || (parseInt(k) >= 0 && isFinite(parseInt(k)));
const isValidWhatsapp = (n: string) => /^[0-9]{7,15}$/.test(n.replace(/[\s+\-]/g, ""));
const isValidPin = (p: string) => /^\d{4}$/.test(p.trim());

/* =========================================================
   RECEIPT PRINTER
========================================================= */
const printReceipt = (order: Order, lang: string) => {
  const date = new Date(order.created_at).toLocaleString(lang === "ar" ? "ar-SA" : "en-US");
  const itemsHtml = order.items.map(i => `<tr><td style="padding:2px 8px;">${i.name}</td><td style="padding:2px 8px;text-align:center;">x${i.qty}</td></tr>`).join("");
  const vat = order.total / 1.15 * 0.15;
  const subtotal = order.total - vat;
  const deliveryInfo = order.method === "delivery" && order.deliveryAddress
    ? `<div class="row"><span>${lang === "ar" ? "العنوان" : "Address"}:</span><span>${order.deliveryAddress}</span></div>${order.deliveryArea ? `<div class="row"><span>${lang === "ar" ? "الحي" : "Area"}:</span><span>${order.deliveryArea}</span></div>` : ""}${order.deliveryLandmark ? `<div class="row"><span>${lang === "ar" ? "معلم قريب" : "Landmark"}:</span><span>${order.deliveryLandmark}</span></div>` : ""}` : "";
  const html = `<!DOCTYPE html><html dir="${lang === "ar" ? "rtl" : "ltr"}"><head><meta charset="UTF-8"/><title>Receipt #${order.id}</title><style>body{font-family:monospace;font-size:15px;width:380px;margin:0 auto;padding:20px;}h2{text-align:center;font-size:16px;margin-bottom:4px;}.sub{text-align:center;font-size:10px;color:#666;margin-bottom:12px;}table{width:100%;border-collapse:collapse;}.divider{border-top:1px dashed #000;margin:8px 0;}.row{display:flex;justify-content:space-between;padding:2px 0;}.total{font-weight:bold;font-size:17px;}.footer{text-align:center;margin-top:16px;font-size:10px;color:#888;}</style></head><body><h2>☕ Brew Café</h2><div class="sub">Madinah · VAT: 123456789 · ${date}</div><div class="divider"></div><table>${itemsHtml}</table><div class="divider"></div><div class="row"><span>${lang === "ar" ? "المجموع قبل الضريبة" : "Subtotal"}:</span><span>${subtotal.toFixed(2)} SAR</span></div><div class="row"><span>${lang === "ar" ? "ضريبة القيمة المضافة 15%" : "VAT 15%"}:</span><span>${vat.toFixed(2)} SAR</span></div><div class="divider"></div><div class="row total"><span>${lang === "ar" ? "الإجمالي" : "Total"}:</span><span>${order.total.toFixed(2)} SAR</span></div><div class="row"><span>${lang === "ar" ? "طريقة الدفع" : "Payment"}:</span><span>${order.paymentMethod}</span></div><div class="row"><span>${lang === "ar" ? "حالة الدفع" : "Payment Status"}:</span><span>${order.paymentStatus}</span></div><div class="divider"></div><div class="row"><span>${lang === "ar" ? "طريقة الاستلام" : "Method"}:</span><span>${order.method}</span></div>${deliveryInfo}${order.notes ? `<div class="row"><span>${lang === "ar" ? "ملاحظات" : "Notes"}:</span><span>${order.notes}</span></div>` : ""}<div class="footer">${lang === "ar" ? "شكراً لزيارتكم · بريو كافيه" : "Thank you for visiting · Brew Café"}</div></body></html>`;
  const win = window.open("", "_blank", "width=400,height=600");
  if (win) { win.document.write(html); win.document.close(); win.print(); }
};

/* =========================================================
   FLOATING PARTICLES
========================================================= */
function FloatingParticles({ emojis, count = 18 }: { emojis: string[]; count?: number }) {
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i, emoji: emojis[i % emojis.length],
      x: Math.random() * 100, y: Math.random() * 100,
      size: 14 + Math.random() * 22, duration: 6 + Math.random() * 10,
      delay: Math.random() * 5, drift: (Math.random() - 0.5) * 60,
    })), [emojis, count]);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <motion.div key={p.id} className="absolute select-none"
          style={{ left: `${p.x}%`, top: `${p.y}%`, fontSize: p.size, opacity: 0 }}
          animate={{ y: [0, -80, -160], x: [0, p.drift, p.drift * 1.5], opacity: [0, 0.6, 0], rotate: [0, p.drift > 0 ? 20 : -20, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}>
          {p.emoji}
        </motion.div>
      ))}
    </div>
  );
}

/* =========================================================
   MENU ROW CAROUSEL
========================================================= */
function MenuRowCarousel({ items, lang, onAdd }: { items: MenuItem[]; lang: string; onAdd: (item: MenuItem) => void }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pauseAuto = useCallback(() => { if (autoRef.current) clearInterval(autoRef.current); }, []);
  const resumeAuto = useCallback(() => {
    pauseAuto();
    autoRef.current = setInterval(() => {
      const el = rowRef.current; if (!el) return;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) el.scrollTo({ left: 0, behavior: "smooth" });
      else el.scrollBy({ left: 280, behavior: "smooth" });
    }, 3200 + Math.random() * 800);
  }, [pauseAuto]);
  useEffect(() => { resumeAuto(); return () => pauseAuto(); }, [resumeAuto, pauseAuto]);
  if (items.length === 0) return null;
  return (
    <div className="relative">
      <button type="button" onClick={() => { rowRef.current?.scrollBy({ left: -280, behavior: "smooth" }); pauseAuto(); setTimeout(resumeAuto, 4000); }}
        className="absolute ltr:left-0 rtl:right-0 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-zinc-900/95 border border-zinc-700 text-white flex items-center justify-center shadow-xl hover:bg-[#800020] hover:border-[#800020] transition-all ltr:-translate-x-3 rtl:translate-x-3">
        <ChevronLeft size={15} />
      </button>
      <button type="button" onClick={() => { rowRef.current?.scrollBy({ left: 280, behavior: "smooth" }); pauseAuto(); setTimeout(resumeAuto, 4000); }}
        className="absolute ltr:right-0 rtl:left-0 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-zinc-900/95 border border-zinc-700 text-white flex items-center justify-center shadow-xl hover:bg-[#800020] hover:border-[#800020] transition-all ltr:translate-x-3 rtl:-translate-x-3">
        <ChevronRight size={15} />
      </button>
      <div ref={rowRef} className="flex gap-4 overflow-x-auto scrollbar-none px-4 pb-3 pt-1"
        style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
        onMouseEnter={pauseAuto} onMouseLeave={resumeAuto}
        onTouchStart={pauseAuto} onTouchEnd={() => setTimeout(resumeAuto, 3000)}>
        {items.map(item => (
          <div key={item.id} style={{ scrollSnapAlign: "start", minWidth: "260px", maxWidth: "260px" }}
            className={`group rounded-3xl border bg-zinc-950/60 backdrop-blur-md overflow-hidden flex flex-col justify-between transition-transform duration-200 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/40 flex-shrink-0 ${!item.inStock ? "border-zinc-900/40 opacity-40" : "border-zinc-800/60 hover:border-zinc-600"}`}>
            <div className="relative h-44 overflow-hidden bg-zinc-900">
              {item.img
                ? <img src={item.img} alt={item.name[lang as keyof LocalizedString]} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                : <div className="w-full h-full flex items-center justify-center text-zinc-700 text-4xl">☕</div>}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
              <div className="absolute top-3 ltr:left-3 rtl:right-3 ltr:right-3 rtl:left-3 flex justify-between items-start w-[calc(100%-24px)]">
                <span className="bg-black/70 backdrop-blur-md text-[9px] font-black text-[#d9ab7d] px-2.5 py-1 rounded-lg border border-[#d9ab7d]/20 uppercase tracking-wider shadow">{item.badge}</span>
                {!item.inStock && <span className="bg-red-900/90 backdrop-blur-md text-white text-[9px] font-black px-2.5 py-1 rounded-lg border border-red-700 animate-pulse uppercase">{lang === "ar" ? "نفذ" : "Out of Stock"}</span>}
              </div>
              <div className="absolute bottom-3 ltr:left-3 rtl:right-3">
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-white/5">{item.cat}</span>
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between gap-3">
              <div>
                <div className="flex justify-between items-start gap-2 mb-1.5">
                  <h3 className="font-black text-[14px] text-white group-hover:text-[#d9ab7d] transition-colors leading-snug">{item.name[lang as keyof LocalizedString]}</h3>
                  <div className="text-right flex-shrink-0 mt-0.5">
                    <span className="text-base font-black font-mono text-[#d9ab7d] leading-none">{item.price}</span>
                    <span className="text-[9px] text-zinc-500 block uppercase tracking-widest">SAR</span>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">{item.desc[lang as keyof LocalizedString]}</p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60">
                <div className="flex items-center gap-1 text-zinc-500">
                  <span className="text-[10px] font-mono tracking-wide">{item.kcal}</span>
                  <span className="text-[9px] uppercase tracking-widest">{lang === "ar" ? "سعرة" : "KCAL"}</span>
                </div>
                <button type="button" onClick={() => onAdd(item)} disabled={!item.inStock}
                  className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-md ${!item.inStock ? "bg-zinc-900 text-zinc-700 cursor-not-allowed" : "bg-white text-black hover:bg-[#800020] hover:text-white cursor-pointer"}`}>
                  <Plus size={17} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   EVENT CARD
========================================================= */
function EventCard({ ev, isActive, lang, onToggle }: { ev: IslamicEvent; isActive: boolean; lang: string; onToggle: () => void }) {
  const meta = EVENT_META[ev.id];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`relative rounded-3xl overflow-hidden border transition-all duration-500 cursor-pointer ${isActive ? "border-white/20 shadow-2xl scale-[1.01]" : "border-zinc-800 hover:border-zinc-600 hover:scale-[1.005]"}`}
      style={{ background: meta.gradient, boxShadow: isActive ? `0 0 60px ${meta.glowColor}50,0 4px 30px rgba(0,0,0,0.8)` : "0 4px 20px rgba(0,0,0,0.5)" }}
      onClick={onToggle}>
      <motion.div className="absolute inset-0 pointer-events-none" style={{ background: meta.bgPattern }}
        animate={isActive ? { opacity: [0.6, 1, 0.6] } : { opacity: 0.4 }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
      {isActive && <FloatingParticles emojis={meta.particleEmoji} count={14} />}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.1) 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
      <div className="relative z-10 p-6">
        <div className="flex items-start justify-between mb-5">
          <div className="h-7 px-3 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5" style={{ background: `${meta.glowColor}30`, border: `1px solid ${meta.accentColor}40`, color: meta.accentColor }}>
            <Icon size={10} />{lang === "ar" ? meta.badgeAr : meta.badgeEn}
          </div>
          {isActive && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="h-6 px-2.5 rounded-full bg-white/10 border border-white/20 text-[9px] font-black text-white flex items-center gap-1.5">
              <motion.div className="h-1.5 w-1.5 rounded-full bg-white" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
              {lang === "ar" ? "مُفعّل" : "LIVE"}
            </motion.div>
          )}
        </div>
        <motion.div className="text-6xl mb-4 select-none leading-none"
          animate={isActive ? { rotate: [0, -5, 5, -3, 3, 0], scale: [1, 1.1, 1] } : { rotate: 0, scale: 1 }}
          transition={isActive ? { duration: 2, repeat: Infinity, repeatDelay: 3 } : { duration: 0.3 }}>
          {ev.sticker}
        </motion.div>
        <h3 className="text-2xl font-black text-white leading-tight mb-2 tracking-tight">{lang === "ar" ? meta.headerAr : meta.headerEn}</h3>
        <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.55)" }}>{lang === "ar" ? meta.subAr : meta.subEn}</p>
        <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={e => { e.stopPropagation(); onToggle(); }}
          className="w-full h-12 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2"
          style={isActive ? { background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white" } : { background: meta.accentColor, color: "#000", boxShadow: `0 4px 20px ${meta.glowColor}60` }}>
          {isActive ? <><X size={13} />{lang === "ar" ? "إلغاء تفعيل المظهر" : "Deactivate Theme"}</> : <><Sparkles size={13} />{lang === "ar" ? "تفعيل المظهر الآن" : "Activate Theme"}</>}
        </motion.button>
      </div>
      {isActive && (
        <motion.div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg,transparent,${meta.accentColor},transparent)` }}
          animate={{ x: ["-100%", "100%"] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} />
      )}
    </motion.div>
  );
}

/* =========================================================
   ACTIVE EVENT BANNER
========================================================= */
function ActiveEventBanner({ event, lang }: { event: IslamicEvent; lang: string }) {
  const meta = EVENT_META[event.id];
  if (!meta) return null;
  return (
    <motion.div key={event.id} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl mb-6 mx-4 sm:mx-6 lg:mx-8"
      style={{ background: meta.gradient, border: `1px solid ${meta.accentColor}30`, boxShadow: `0 0 80px ${meta.glowColor}30,0 4px 40px rgba(0,0,0,0.7)` }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: meta.bgPattern }} />
      <FloatingParticles emojis={meta.particleEmoji} count={20} />
      <div className="relative z-10 px-6 py-8 sm:px-10 sm:py-10 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative flex-shrink-0">
          <motion.div className="text-7xl sm:text-8xl select-none leading-none"
            animate={{ scale: [1, 1.06, 1], rotate: [0, -3, 3, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
            {event.sticker}
          </motion.div>
          <div className="absolute inset-0 blur-2xl opacity-40 pointer-events-none" style={{ background: meta.glowColor, borderRadius: "50%" }} />
        </div>
        <div className="text-center sm:ltr:text-left sm:rtl:text-right flex-1">
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
            style={{ background: `${meta.accentColor}20`, border: `1px solid ${meta.accentColor}40`, color: meta.accentColor }}>
            <motion.div className="h-1.5 w-1.5 rounded-full" style={{ background: meta.accentColor }} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
            {lang === "ar" ? meta.badgeAr : meta.badgeEn}
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight mb-2">{lang === "ar" ? meta.headerAr : meta.headerEn}</h2>
          <p className="text-sm leading-relaxed max-w-lg" style={{ color: "rgba(255,255,255,0.60)" }}>{lang === "ar" ? meta.subAr : meta.subEn}</p>
        </div>
      </div>
      <motion.div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${meta.accentColor}80,transparent)` }}
        animate={{ x: ["-100%", "100%"] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
    </motion.div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */
export default function BrewCafeUltraElite() {
  const [dbStatus, setDbStatus] = React.useState("Connecting...");
  const [lang, setLang] = useState("en");
  const [view, setView] = useState("customer");
  const [menuData, setMenuData] = useState<MenuItem[]>(INITIAL_MENU);
 const brewGallery = useMemo(() => {
  const imgs = menuData.filter(m => m.img && m.img.trim() !== "").map(m => m.img);
  return imgs.length > 0 ? imgs : [
    "https://i.ibb.co/C5h4pwWp/DSC03598.jpg",
    "https://i.ibb.co/1fjCWLkp/DSC03628.jpg",
    "https://i.ibb.co/JRG2PBmt/DSC03596.jpg",
    "https://i.ibb.co/MyQnzrKC/DSC03641.jpg",
    "https://i.ibb.co/1GfDjjPn/DSC05596.jpg",
    "https://i.ibb.co/MyQnzrKC/DSC03641.jpg",
    "https://i.ibb.co/prGWBwTB/DSC05611.jpg",
    "https://i.ibb.co/1fkrbFvJ/DSC05573-1.jpg",
    "https://i.ibb.co/5WqTkNMB/DSC05609.jpg",
    "https://i.ibb.co/b5rGM5Rj/DSC05585.jpg",
    "https://i.ibb.co/cc2nqLLJ/DSC05630.jpg",
    "https://i.ibb.co/MDBXYPmC/DSC05632.jpg",
    "https://i.ibb.co/pBrPfPrf/DSC05626.jpg",
    "https://i.ibb.co/hRyLJCg1/DSC05617.jpg",
   " https://i.ibb.co/zd84YQ1/DSC05622.jpg",
   "https://i.ibb.co/ZpcfDWrt/DSC03612.jpg",

  ];
 }, [menuData]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOrderSending, setIsOrderSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const stockTogglingRef = useRef<Set<number>>(new Set());
  const [heroIndex, setHeroIndex] = useState(0);
  const [promoBlock, setPromoBlock] = useState<PromoBlock>(DEFAULT_PROMO);
  const [promoEdit, setPromoEdit] = useState<PromoBlock>(DEFAULT_PROMO);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [newListing, setNewListing] = useState<NewListingState>({ nameEn: "", nameAr: "", descEn: "", descAr: "", price: "", kcal: "", cat: "hot", badge: "New", imgUrl: "" });
  const [pin, setPin] = useState("");
  const [ownerPin, setOwnerPin] = useState("1234");
  const [superAdminPinInput, setSuperAdminPinInput] = useState("");
  const [isSuperAdminVerified, setIsSuperAdminVerified] = useState(false);
  const [pinChangeInput, setPinChangeInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("966502013071");
  const [isPinRecoveryOpen, setIsPinRecoveryOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const isPlacingOrderRef = useRef(false);
  const [bgIndex, setBgIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [timerPopup, setTimerPopup] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeEvent, setActiveEvent] = useState<IslamicEvent | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({ name: "", phone: "", method: "pickup", notes: "", paymentMethod: "cash", deliveryAddress: "", deliveryArea: "", deliveryLandmark: "" });
  const [cartErrors, setCartErrors] = useState<{ name?: string; phone?: string; deliveryAddress?: string }>({});
  const [ownerTab, setOwnerTab] = useState("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [pastOrders, setPastOrders] = useState<Order[]>([]);
  const [revenuePeriod, setRevenuePeriod] = useState("today");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderDateFrom, setOrderDateFrom] = useState("");
  const [orderDateTo, setOrderDateTo] = useState("");
  const [staffFilter, setStaffFilter] = useState("active");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [listingErrors, setListingErrors] = useState<Record<string, string>>({});
  const toastCooldownRef = useRef<Map<string, number>>(new Map());

  const switchView = useCallback((v: string) => {
    if (v !== "customer") { setCart([]); setCustomerInfo({ name: "", phone: "", method: "pickup", notes: "", paymentMethod: "cash", deliveryAddress: "", deliveryArea: "", deliveryLandmark: "" }); setCartErrors({}); setIsCartOpen(false); }
    setView(v);
  }, []);

  const playOrderPing = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
    } catch { /* ignore */ }
  }, []);

  const showToast = useCallback((text: string, type: "success" | "error" | "info" = "success", dedupeKey?: string) => {
    const key = dedupeKey || text; const now = Date.now();
    const lastShown = toastCooldownRef.current.get(key) || 0;
    if (now - lastShown < 2000) return;
    toastCooldownRef.current.set(key, now);
    const id = now + Math.random();
    setToasts(prev => { const trimmed = prev.length >= 3 ? prev.slice(-2) : prev; return [...trimmed, { id, text, type }]; });
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  useEffect(() => { const t = setInterval(() => setHeroIndex(p => (p + 1) % brewGallery.length), 4000); return () => clearInterval(t); }, [brewGallery.length]);

  useEffect(() => {
    const systemClock = setInterval(() => setCurrentTime(new Date()), 30000);
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize(); window.addEventListener("resize", handleResize);
    return () => { clearInterval(systemClock); window.removeEventListener("resize", handleResize); };
  }, []);

  useEffect(() => {
    async function initializeAppEngine() {
      setIsSyncing(true);
      try {
        const { data: menuCloudData, error: menuError } = await supabase.from('brew_cafe_menu').select('*').order('id', { ascending: true });
        if (!menuError && menuCloudData && menuCloudData.length > 0) setMenuData(menuCloudData as MenuItem[]);
        else if (menuError) { console.warn("Menu fetch failed:", menuError.message); setMenuData(INITIAL_MENU); }
        const { data: ordersCloudData, error: ordersError } = await supabase.from('brew_cafe_orders').select('*').order('created_at', { ascending: false });
        if (!ordersError && ordersCloudData) { setOrders(ordersCloudData as Order[]); setDbStatus("Connected Successfully!"); }
        else { if (ordersError) console.warn("Orders fetch error:", ordersError.message); setDbStatus("Connection Failed"); }
        try { const lp = localStorage.getItem("brew_cafe_past_orders"); if (lp) setPastOrders(JSON.parse(lp)); } catch { /* ignore */ }
        const { data: settingsData } = await supabase.from('brew_cafe_settings').select('*');
        if (settingsData) {
          const pinRow = settingsData.find((s: { key: string; value: string }) => s.key === 'owner_pin');
          const waRow = settingsData.find((s: { key: string; value: string }) => s.key === 'whatsapp_number');
          if (pinRow && isValidPin(pinRow.value)) setOwnerPin(pinRow.value);
          if (waRow && isValidWhatsapp(waRow.value)) setWhatsappNumber(waRow.value);
          const evRow = settingsData.find((s: { key: string; value: string }) => s.key === 'active_event');
          if (evRow && evRow.value) { const foundEv = ISLAMIC_EVENTS.find(e => e.id === evRow.value); if (foundEv) setActiveEvent(foundEv); }
          const promoRow = settingsData.find((s: { key: string; value: string }) => s.key === 'promo_block');
          if (promoRow && promoRow.value) { try { const parsed = JSON.parse(promoRow.value); setPromoBlock(parsed); setPromoEdit(parsed); } catch { /* ignore */ } }
        }
        setIsLoaded(true);
      } catch (err) {
        console.error("Init failed:", err);
        showToast("Database connection failed. Menu loaded from cache.", "error", "db-init-fail");
        setDbStatus("Connection Failed"); setMenuData(INITIAL_MENU); setIsLoaded(true);
      }
      setIsSyncing(false);
    }
    initializeAppEngine();
    const liveStreamChannel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brew_cafe_orders' }, payload => {
        if (payload.eventType === 'INSERT') { setOrders(prev => prev.some(o => o.id === (payload.new as Order).id) ? prev : [payload.new as Order, ...prev]); playOrderPing(); }
        else if (payload.eventType === 'UPDATE') setOrders(prev => prev.map(o => o.id === payload.new.id ? (payload.new as Order) : o));
        else if (payload.eventType === 'DELETE') setOrders(prev => prev.filter(o => o.id !== (payload.old as Order).id));
      }).subscribe();
    return () => { supabase.removeChannel(liveStreamChannel); };
  }, []); // eslint-disable-line

  useEffect(() => { if (!isLoaded) return; try { localStorage.setItem("brew_cafe_past_orders", JSON.stringify(pastOrders.slice(0, 50))); } catch { /* incognito */ } }, [pastOrders, isLoaded]);
  useEffect(() => { if (!isLoaded || !ownerPin) return; supabase.from('brew_cafe_settings').upsert({ key: 'owner_pin', value: ownerPin }, { onConflict: 'key' }).then(({ error }) => { if (error) console.error('PIN save error:', error); }); }, [ownerPin, isLoaded]);
  useEffect(() => { if (!isLoaded || !whatsappNumber) return; supabase.from('brew_cafe_settings').upsert({ key: 'whatsapp_number', value: whatsappNumber }, { onConflict: 'key' }).then(({ error }) => { if (error) console.error('WA save error:', error); }); }, [whatsappNumber, isLoaded]);
  useEffect(() => { if (!isLoaded) return; supabase.from('brew_cafe_settings').upsert({ key: 'active_event', value: activeEvent?.id || '' }, { onConflict: 'key' }).then(({ error }) => { if (error) console.error('Event save error:', error); }); }, [activeEvent, isLoaded]);
  useEffect(() => { if (!isLoaded) return; supabase.from('brew_cafe_settings').upsert({ key: 'promo_block', value: JSON.stringify(promoBlock) }, { onConflict: 'key' }).then(({ error }) => { if (error) console.error('Promo save error:', error); }); }, [promoBlock, isLoaded]);
  useEffect(() => {
    const mm = String(currentTime.getMonth() + 1).padStart(2, "0"); const dd = String(currentTime.getDate()).padStart(2, "0");
    const found = ISLAMIC_EVENTS.find(e => e.date === `${mm}-${dd}`);
    if (found && (!activeEvent || activeEvent.id !== found.id)) setActiveEvent(found);
  }, [currentTime, activeEvent]);
  useEffect(() => { const interval = setInterval(() => setBgIndex(prev => (prev + 1) % COLORS.length), 15000); return () => clearInterval(interval); }, []);

  const verifyPin = useCallback(async (inputPin: string) => {
    const trimmed = inputPin.trim(); if (!isValidPin(trimmed)) return;
    setIsSyncing(true); await new Promise(res => setTimeout(res, 300));
    if (trimmed === ownerPin) { switchView("hub"); setPin(""); setPinError(""); showToast("Access granted.", "success", "pin-grant"); }
    else { setPinError(lang === "ar" ? "الرمز غير صحيح" : "Incorrect PIN."); setPin(""); showToast("Incorrect PIN. Try again.", "error", "pin-error"); }
    setIsSyncing(false);
  }, [ownerPin, lang, showToast, switchView]);
  useEffect(() => { if (pin.trim().length === 4) verifyPin(pin); }, [pin, verifyPin]);

  const filteredMenu = useMemo(() => menuData?.filter(item => {
    const catOk = activeCategory === "all" || item.cat?.toLowerCase() === activeCategory.toLowerCase();
    const searchOk = item?.name?.en?.toLowerCase().includes(search.toLowerCase()) || item?.name?.ar?.includes(search);
    return catOk && searchOk;
  }), [menuData, activeCategory, search]);

  const menuRows = useMemo(() => {
    const rows: MenuItem[][] = [[], [], [], []];
    filteredMenu.forEach((item, i) => rows[i % 4].push(item));
    return rows.filter(r => r.length > 0);
  }, [filteredMenu]);

  const addToCart = useCallback((item: MenuItem) => {
    if (!item.inStock) { showToast(lang === "ar" ? "هذا المنتج غير متوفر حالياً" : "This item is currently out of stock.", "error", `oos-${item.id}`); return; }
    setCart(prev => {
      const exist = prev.find(i => i.id === item.id);
      if (exist) { if (exist.qty >= 20) { showToast(lang === "ar" ? "الحد الأقصى 20 قطعة" : "Maximum 20 per item.", "info", `max-${item.id}`); return prev; } return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i); }
      return [...prev, { ...item, qty: 1 }];
    });
    showToast(lang === "ar" ? "تمت الإضافة إلى الحقيبة" : `${item.name[lang as keyof LocalizedString]} added to bag.`, "success", `added-${item.id}`);
  }, [lang, showToast]);

  const updateQty = useCallback((id: number, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id !== id) return i;
      if (delta > 0 && i.qty >= 20) { showToast(lang === "ar" ? "الحد الأقصى 20 قطعة" : "Maximum 20 per item.", "info", `max-${id}`); return i; }
      return { ...i, qty: Math.min(20, Math.max(1, i.qty + delta)) };
    }));
  }, [lang, showToast]);

  const deleteFromCart = useCallback((id: number) => {
    setCart(prev => prev.filter(i => i.id !== id));
    showToast(lang === "ar" ? "تمت الإزالة من الحقيبة" : "Item removed from bag.", "info", `removed-${id}`);
  }, [lang, showToast]);

  const deleteFromMenu = async (id: number) => {
    if (!window.confirm(lang === "ar" ? "هل أنت متأكد من حذف هذا المنتج نهائياً؟" : "Permanently delete this product?")) return;
    setIsSyncing(true);
    const { error } = await supabase.from('brew_cafe_menu').delete().eq('id', id);
    if (!error) { setMenuData(prev => prev.filter(item => item.id !== id)); showToast(lang === "ar" ? "تم حذف المنتج بنجاح" : "Product deleted successfully.", "success", "menu-delete"); }
    else showToast(lang === "ar" ? "فشل الحذف — تحقق من صلاحيات Supabase RLS" : "Failed to delete. Check Supabase RLS policy.", "error", "menu-delete-fail");
    setIsSyncing(false);
  };

  const subtotal = useMemo(() => cart.reduce((acc, i) => acc + i.price * i.qty, 0), [cart]);
  const vat = useMemo(() => subtotal * 0.15, [subtotal]);
  const total = useMemo(() => subtotal + vat, [subtotal, vat]);

  const validateCartForm = (): boolean => {
    const errors: { name?: string; phone?: string; deliveryAddress?: string } = {};
    if (!isValidName(customerInfo.name)) errors.name = lang === "ar" ? "الاسم مطلوب (حرفان على الأقل)" : "Name is required (minimum 2 characters)";
    if (!isValidPhone(customerInfo.phone)) errors.phone = lang === "ar" ? "رقم الجوال غير صحيح" : "Please enter a valid phone number";
    if (customerInfo.method === "delivery" && customerInfo.deliveryAddress.trim().length < 5) errors.deliveryAddress = lang === "ar" ? "العنوان مطلوب للتوصيل" : "Delivery address is required";
    setCartErrors(errors); return Object.keys(errors).length === 0;
  };

  const placeOrder = async () => {
    if (cart.length === 0) { showToast(lang === "ar" ? "الحقيبة فارغة" : "Your bag is empty.", "error", "cart-empty"); return; }
    if (!validateCartForm()) return; if (isPlacingOrderRef.current) return;
    const deliveryBlock = customerInfo.method === "delivery"
      ? `\n📍 ${lang === "ar" ? "العنوان" : "Address"}: ${customerInfo.deliveryAddress.trim()}${customerInfo.deliveryArea.trim() ? `\n🏘 ${lang === "ar" ? "الحي" : "Area"}: ${customerInfo.deliveryArea.trim()}` : ""}${customerInfo.deliveryLandmark.trim() ? `\n🏢 ${lang === "ar" ? "معلم قريب" : "Landmark"}: ${customerInfo.deliveryLandmark.trim()}` : ""}` : "";
    if (customerInfo.paymentMethod === "online") {
      let message = `☕ BREW CAFÉ ORDER\n\n👤 ${customerInfo.name.trim()}\n📞 ${customerInfo.phone.trim()}\n🚚 ${customerInfo.method}${deliveryBlock}\n💳 MOBILE PAY\n\n`;
      cart.forEach(item => { message += `• ${item.qty}x ${item.name.en} — ${(item.price * item.qty).toFixed(2)} SAR\n`; });
      message += `\nSubtotal: ${subtotal.toFixed(2)} SAR\nVAT (15%): ${vat.toFixed(2)} SAR\n💰 Total: ${total.toFixed(2)} SAR`;
      if (customerInfo.notes.trim()) message += `\n📝 ${customerInfo.notes.trim()}`;
      window.open(`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, "_blank");
    }
    isPlacingOrderRef.current = true; setIsOrderSending(true);
    const newOrder = { customer: customerInfo.name.trim(), phone: customerInfo.phone.trim(), method: customerInfo.method, items: cart.map(i => ({ name: i.name.en, qty: i.qty })), total, status: "Queued", created_at: Date.now(), notes: customerInfo.notes.trim().slice(0, 200), previousStatus: null, paymentMethod: customerInfo.paymentMethod, paymentStatus: customerInfo.paymentMethod === "cash" ? "pending" : "paid" as PaymentStatus, deliveryAddress: customerInfo.deliveryAddress.trim() || null, deliveryArea: customerInfo.deliveryArea.trim() || null, deliveryLandmark: customerInfo.deliveryLandmark.trim() || null };
    try {
      const { data: insertedData, error } = await supabase.from('brew_cafe_orders').insert([newOrder]).select().single();
      if (!error && insertedData) {
        const savedOrder = insertedData as Order;
        setPastOrders(prev => [savedOrder, ...prev]);
        await Promise.all(cart.map(cartItem => supabase.from('brew_cafe_menu').update({ sold: (menuData.find(m => m.id === cartItem.id)?.sold || 0) + cartItem.qty }).eq('id', cartItem.id)));
        setMenuData(prev => prev.map(m => { const ci = cart.find(c => c.id === m.id); return ci ? { ...m, sold: m.sold + ci.qty } : m; }));
        if (customerInfo.paymentMethod === "cash") {
          let message = `☕ BREW CAFÉ ORDER #${savedOrder.id}\n\n👤 ${customerInfo.name.trim()}\n📞 ${customerInfo.phone.trim()}\n🚚 ${customerInfo.method}${deliveryBlock}\n💳 CASH\n\n`;
          cart.forEach(item => { message += `• ${item.qty}x ${item.name.en} — ${(item.price * item.qty).toFixed(2)} SAR\n`; });
          message += `\nSubtotal: ${subtotal.toFixed(2)} SAR\nVAT (15%): ${vat.toFixed(2)} SAR\n💰 Total: ${total.toFixed(2)} SAR`;
          if (customerInfo.notes.trim()) message += `\n📝 ${customerInfo.notes.trim()}`;
          window.open(`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, "_blank");
        }
        showToast(`Order #${savedOrder.id} placed successfully!`, "success", "order-placed");
        setCart([]); setCustomerInfo({ name: "", phone: "", method: "pickup", notes: "", paymentMethod: "cash", deliveryAddress: "", deliveryArea: "", deliveryLandmark: "" }); setCartErrors({}); setIsCartOpen(false);
      } else showToast(error?.message?.includes("policy") || error?.code === "42501" ? "Order failed: Supabase RLS blocks inserts. Enable anon insert on brew_cafe_orders." : "Failed to place order. Please check your connection.", "error", "order-fail");
    } catch { showToast("An unexpected error occurred. Please try again.", "error", "order-error"); }
    finally { setIsOrderSending(false); isPlacingOrderRef.current = false; }
  };

  const updateOrderStatusCloud = async (orderId: number, updatedStatus: string, previousStatusValue: string | null = null) => {
    setIsSyncing(true);
    const { error } = await supabase.from('brew_cafe_orders').update({ status: updatedStatus, previousStatus: previousStatusValue }).eq('id', orderId);
    if (!error) { setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: updatedStatus, previousStatus: previousStatusValue } : o)); showToast(`Status updated to ${updatedStatus}.`, "success", `status-${orderId}`); }
    else showToast("Status update failed.", "error", `status-fail-${orderId}`);
    setIsSyncing(false);
  };

  const updatePaymentStatus = async (orderId: number, newPaymentStatus: PaymentStatus) => {
    setIsSyncing(true);
    const { error } = await supabase.from('brew_cafe_orders').update({ paymentStatus: newPaymentStatus }).eq('id', orderId);
    if (!error) { setOrders(prev => prev.map(o => o.id === orderId ? { ...o, paymentStatus: newPaymentStatus } : o)); showToast(`Payment marked as ${newPaymentStatus}.`, "success", `pay-${orderId}`); }
    else showToast("Payment update failed.", "error", `pay-fail-${orderId}`);
    setIsSyncing(false);
  };

  const toggleStockStatusCloud = async (itemId: number, currentStockStatus: boolean) => {
    if (stockTogglingRef.current.has(itemId)) return;
    stockTogglingRef.current.add(itemId);
    try {
      const targetStatus = !currentStockStatus;
      const { error } = await supabase.from('brew_cafe_menu').update({ inStock: targetStatus }).eq('id', itemId);
      if (error) throw error;
      setMenuData(prev => prev.map(m => m.id === itemId ? { ...m, inStock: targetStatus } : m));
      showToast(`Stock updated to ${targetStatus ? "In Stock" : "Out of Stock"}.`, "success", `stock-${itemId}`);
    } catch (err: unknown) {
      const e = err as { message?: string; code?: string };
      showToast(e?.message?.includes("policy") || e?.code === "42501" ? "Stock update failed: Check Supabase RLS policy." : "Stock update failed.", "error", `stock-fail-${itemId}`);
    } finally { stockTogglingRef.current.delete(itemId); }
  };

  const handleStorageBucketImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const imageFile = e.target.files?.[0]; if (!imageFile) return;
    if (!imageFile.type.startsWith("image/")) { showToast("Only image files are allowed.", "error", "upload-type"); return; }
    if (imageFile.size > 5 * 1024 * 1024) { showToast("Image must be under 5MB.", "error", "upload-size"); return; }
    setIsUploading(true); showToast("Uploading image...", "info", "upload-start");
    try {
      const ext = imageFile.name.split('.').pop(); const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
      const { error: storageError } = await supabase.storage.from('brew-cafe-images').upload(fileName, imageFile, { cacheControl: '3600', upsert: false });
      if (storageError) throw storageError;
      const { data: publicUrlData } = supabase.storage.from('brew-cafe-images').getPublicUrl(fileName);
      if (publicUrlData?.publicUrl) { setNewListing(prev => ({ ...prev, imgUrl: publicUrlData.publicUrl })); showToast("Image uploaded successfully!", "success", "upload-ok"); }
    } catch (err: unknown) {
      const e = err as { message?: string; statusCode?: number };
      showToast(e?.message?.includes("policy") || e?.message?.includes("Unauthorized") || e?.statusCode === 403 ? "Storage permission error. In Supabase: Storage → brew-cafe-images → Policies → allow anon uploads." : "Image upload failed.", "error", "upload-fail");
    } finally { setIsUploading(false); }
  };

  const validateNewListing = (): boolean => {
    const errors: Record<string, string> = {};
    if (!newListing.nameEn.trim() || newListing.nameEn.trim().length < 2) errors.nameEn = "Required (minimum 2 characters)";
    if (!newListing.nameAr.trim() || newListing.nameAr.trim().length < 2) errors.nameAr = "مطلوب (حرفان على الأقل)";
    if (!isValidPrice(newListing.price)) errors.price = "Price must be a positive number";
    if (!isValidKcal(newListing.kcal)) errors.kcal = "Calories must be 0 or more";
    setListingErrors(errors); return Object.keys(errors).length === 0;
  };

  const deployProductListing = async (e: React.FormEvent) => {
    e.preventDefault(); if (!validateNewListing()) return; setIsSyncing(true);
    const newItem = { badge: newListing.badge || "New", type: newListing.cat === "dessert" ? "Dessert" : newListing.cat === "cold" ? "Cold" : "Hot", name: { en: newListing.nameEn.trim(), ar: newListing.nameAr.trim() }, desc: { en: newListing.descEn.trim() || "Artisanal Brew selection.", ar: newListing.descAr.trim() || "خيارات بريو الفاخرة." }, price: parseFloat(newListing.price), kcal: parseInt(newListing.kcal) || 0, cat: newListing.cat, sold: 0, img: newListing.imgUrl?.trim() || "https://i.ibb.co/MyQnzrKC/DSC03641.jpg", inStock: true };
    const { data: insertedItem, error } = await supabase.from('brew_cafe_menu').insert([newItem]).select().single();
    if (!error && insertedItem) { setMenuData(prev => [...prev, insertedItem as MenuItem]); setIsDeployModalOpen(false); setNewListing({ nameEn: "", nameAr: "", descEn: "", descAr: "", price: "", kcal: "", cat: "hot", badge: "New", imgUrl: "" }); setListingErrors({}); showToast("Product deployed successfully!", "success", "deploy-ok"); }
    else showToast(error?.message?.includes("policy") || error?.code === "42501" ? "Failed: Supabase RLS blocks insert on brew_cafe_menu. Add anon INSERT policy." : "Failed to add product.", "error", "deploy-fail");
    setIsSyncing(false);
  };

  const handleClearLiveDashboardCache = async () => {
    setShowClearConfirm(false); setIsSyncing(true);
    const { error } = await supabase.from('brew_cafe_orders').delete().gt('id', 0);
    if (!error) { setOrders([]); setPastOrders([]); try { localStorage.removeItem("brew_cafe_past_orders"); } catch { /* ignore */ } showToast("All orders have been cleared.", "success", "orders-cleared"); }
    else showToast("Clear failed. Check permissions.", "error", "clear-fail");
    setIsSyncing(false);
  };

  const filteredOrdersForRevenue = useMemo(() => {
    const now = new Date(); const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return orders.filter(order => {
      if (!order.created_at) return false;
      if (revenuePeriod === "today") return order.created_at >= startOfToday;
      if (revenuePeriod === "week") return order.created_at >= new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).getTime();
      if (revenuePeriod === "month") return order.created_at >= new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      if (revenuePeriod === "6months") return order.created_at >= new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()).getTime();
      if (revenuePeriod === "1year") return order.created_at >= new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).getTime();
      return true;
    });
  }, [orders, revenuePeriod]);

  const grossRevenue = useMemo(() => filteredOrdersForRevenue.filter(o => o.paymentStatus !== "refunded").reduce((a, b) => a + b.total, 0), [filteredOrdersForRevenue]);
  const cancelledRevenue = useMemo(() => filteredOrdersForRevenue.filter(o => o.status === "Cancelled").reduce((a, b) => a + b.total, 0), [filteredOrdersForRevenue]);
  const netRevenue = useMemo(() => grossRevenue - cancelledRevenue, [grossRevenue, cancelledRevenue]);
  const activeOrdersCount = useMemo(() => orders.filter(o => o.status !== "Delivered" && o.status !== "Cancelled").length, [orders]);
  const lateOrdersCount = useMemo(() => orders.filter(o => (Date.now() - o.created_at) / 1000 > 300 && o.status !== "Delivered" && o.status !== "Cancelled").length, [orders]);
  const activeCustomerOrders = useMemo(() => pastOrders.filter(p => { const live = orders.find(o => o.id === p.id); const status = live?.status || p.status; return status !== "Delivered" && status !== "Cancelled"; }), [pastOrders, orders]);
  const staffVisibleOrders = useMemo(() => {
    let list = orders;
    if (staffFilter === "active") list = orders.filter(o => o.status !== "Delivered");
    else if (staffFilter !== "all") list = orders.filter(o => o.status === staffFilter);
    return [...list].sort((a, b) => {
      const priority: Record<string, number> = { Queued: 0, Preparing: 1, Ready: 2, Cancelled: 3, Delivered: 4 };
      const aPri = priority[a.status] ?? 5; const bPri = priority[b.status] ?? 5;
      if (aPri !== bPri) return aPri - bPri;
      return ((Date.now() - a.created_at) > 300000 ? -1 : 0) - ((Date.now() - b.created_at) > 300000 ? -1 : 0);
    });
  }, [orders, staffFilter]);
  const filteredOwnerOrders = useMemo(() => orders.filter(o => {
    const matchSearch = !orderSearch.trim() || String(o.id).includes(orderSearch.trim()) || o.customer.toLowerCase().includes(orderSearch.toLowerCase()) || o.phone.includes(orderSearch.trim());
    const fromTs = orderDateFrom ? new Date(orderDateFrom).getTime() : 0; const toTs = orderDateTo ? new Date(orderDateTo + "T23:59:59").getTime() : Infinity;
    return matchSearch && o.created_at >= fromTs && o.created_at <= toTs;
  }), [orders, orderSearch, orderDateFrom, orderDateTo]);

  /* =========================================================
     RENDER
  ========================================================= */
  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      style={{
  fontFamily: lang === "ar" ? "'Cairo', sans-serif" : "'Inter', sans-serif",
  WebkitTextSizeAdjust: "100%",
  touchAction: "manipulation",
  backgroundColor: "#040209",
}}
      className={`min-h-screen w-full text-white overflow-x-hidden bg-gradient-to-br transition-all duration-[3000ms] selection:bg-[#800020] ${activeEvent ? activeEvent.color : COLORS[bgIndex]}`}
    >
      {/* ── TOAST NOTIFICATIONS ── */}
      <div className="fixed bottom-5 left-5 z-[9999] flex flex-col gap-2 max-w-[calc(100vw-2.5rem)] w-full sm:max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div key={toast.id} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`p-4 rounded-xl border backdrop-blur-md shadow-2xl pointer-events-auto flex items-center gap-2.5 ${toast.type === "error" ? "bg-red-950/90 border-red-800 text-red-200" : toast.type === "info" ? "bg-zinc-900/90 border-zinc-700 text-zinc-200" : "bg-emerald-950/90 border-emerald-800 text-emerald-200"}`}>
              <div className={`h-2 w-2 flex-shrink-0 rounded-full ${toast.type === "error" ? "bg-red-500" : toast.type === "info" ? "bg-zinc-400" : "bg-emerald-400"}`} />
              <p className="text-xs font-bold leading-tight flex-1">{toast.text}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── CLEAR ORDERS CONFIRM ── */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9500] bg-black/80 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-zinc-950 border border-red-800 rounded-2xl p-6 max-w-sm w-full text-center">
              <AlertTriangle size={36} className="text-red-400 mx-auto mb-3" />
              <h3 className="font-black text-base mb-2 text-white">{lang === "ar" ? "تحذير: إجراء لا يمكن التراجع عنه" : "Warning: This Action Cannot Be Undone"}</h3>
              <p className="text-xs text-zinc-400 mb-5 leading-relaxed">{lang === "ar" ? "سيتم حذف جميع الطلبات نهائياً من قاعدة البيانات." : "This will permanently delete ALL orders from the database."}</p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowClearConfirm(false)} className="flex-1 h-10 rounded-xl bg-zinc-800 text-white text-xs font-black uppercase cursor-pointer hover:bg-zinc-700 transition-colors">{lang === "ar" ? "إلغاء" : "Cancel"}</button>
                <button type="button" onClick={handleClearLiveDashboardCache} className="flex-1 h-10 rounded-xl bg-red-700 text-white text-xs font-black uppercase cursor-pointer hover:bg-red-600 transition-colors">{lang === "ar" ? "نعم، احذف الكل" : "Yes, Delete All"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BACKGROUND VISUALS ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 ltr:-left-40 rtl:-right-40 w-[700px] h-[700px] rounded-full bg-gradient-to-br from-[#800020]/20 to-transparent blur-[160px]" />
        <div className="absolute bottom-[-10%] ltr:right-[-10%] rtl:left-[-10%] w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-[#d9ab7d]/10 to-transparent blur-[200px]" />
        {activeEvent && <div className="absolute top-44 ltr:right-12 rtl:left-12 text-[10rem] opacity-5 select-none font-black filter blur-[2px]" dir="ltr">{activeEvent.sticker}</div>}
      </div>

      {/* ── TIMER POPUP ── */}
      <AnimatePresence>
        {timerPopup && (
          <motion.div initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }} transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="fixed top-24 left-4 right-4 mx-auto max-w-md z-[999] rounded-[30px] bg-zinc-950/95 border border-zinc-800 p-6 backdrop-blur-3xl text-center shadow-2xl">
            <div className="flex items-center justify-center gap-3 mb-3"><Timer className="text-[#d9ab7d]" size={20} /><h4 className="font-black text-sm tracking-wider uppercase">{lang === "ar" ? "معيار سرعة التحضير" : "Brew Time Standard"}</h4></div>
            <p className="text-sm font-medium text-zinc-300 leading-relaxed">{lang === "ar" ? "نهتم بوقتكم — كل طلب يُتابع بأعلى معايير السرعة والجودة." : "We care about your time. Every order is tracked and prepared with maximum speed and quality."}</p>
            <button type="button" onClick={() => setTimerPopup(false)} className="mt-5 text-[10px] font-black tracking-widest bg-white/10 px-5 py-2 rounded-full text-white hover:bg-[#800020] transition-all uppercase">{lang === "ar" ? "إغلاق" : "Acknowledge"}</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOP NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-[9999] px-3 sm:px-5 py-3 border-b border-white/5 bg-zinc-950/90 backdrop-blur-xl">
   <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-1">

    {/* LEFT — Logo */}
    <div
      onClick={() => { switchView("customer"); setIsSuperAdminVerified(false); }}
      className="cursor-pointer select-none group flex-shrink-0 min-w-0"
    >
      <div className="flex items-center gap-1" dir="ltr">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tighter group-hover:text-[#d9ab7d] transition-colors leading-none whitespace-nowrap">
          Brew Café
        </h1>
        {activeEvent && (
          <span className="text-sm inline-block select-none">{activeEvent.sticker}</span>
        )}
      </div>
      <p className="text-[8px] sm:text-[9px] tracking-[0.2em] uppercase text-zinc-500 font-bold truncate">
        {lang === "ar" ? "بريو كافيه · المدينة المنورة" : "BREW CAFÉ · MADINAH"}
      </p>
    </div>

    {/* RIGHT — Controls */}
    <div className="flex items-center gap-1 flex-shrink-0">

      {/* DB status — only on large screens in staff/owner views */}
      {view !== "customer" && (
        <div className="hidden lg:flex items-center gap-1 px-2 h-8 rounded-lg bg-zinc-900/90 border border-zinc-800 text-[9px] font-black tracking-wider uppercase text-zinc-400">
          {isSyncing
            ? <RefreshCw size={9} className="text-[#d9ab7d] animate-spin" />
            : <Wifi size={9} className="text-emerald-400" />}
          <span className="font-mono text-[8px]">
            {isSyncing ? "SYNC" : dbStatus === "Connected Successfully!" ? "LIVE" : "ERR"}
          </span>
        </div>
      )}

      {/* Clock — hidden on very small screens */}
      <button
        type="button"
        onClick={() => setTimerPopup(true)}
        className="flex h-8 px-2 rounded-lg bg-white/5 border border-white/10 items-center gap-1 text-zinc-300 hover:bg-[#800020] hover:text-white transition-all"
      >
        <Timer size={11} className="text-[#d9ab7d] flex-shrink-0" />
        <span className="font-mono font-bold text-[10px]">
          {currentTime.toLocaleTimeString(lang === "ar" ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </button>

      {/* Lang toggle */}
      <div
        onClick={() => setLang(lang === "ar" ? "en" : "ar")}
        className="h-8 w-[52px] rounded-full bg-zinc-900 border border-zinc-800 relative cursor-pointer flex items-center justify-between px-1.5 text-[9px] font-black tracking-widest select-none flex-shrink-0"
      >
        <span className={`z-10 transition-all duration-300 text-[9px] ${lang === "en" ? "text-black font-black" : "text-zinc-500"}`}>EN</span>
        <span className={`z-10 transition-all duration-300 text-[9px] ${lang === "ar" ? "text-black font-black" : "text-zinc-500"}`}>AR</span>
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className={`absolute top-1 bottom-1 w-[22px] rounded-full bg-[#d9ab7d] ${lang === "en" ? "left-1" : "left-[26px]"}`}
        />
      </div>

      {/* Customer-only icons */}
      {view === "customer" && (
        <>
          {pastOrders.length > 0 && (
            <button
              type="button"
              onClick={() => setIsNotificationOpen(true)}
              className="relative h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#800020] hover:text-white transition-all flex-shrink-0"
            >
              <BellRing size={14} className="text-[#d9ab7d]" />
              {activeCustomerOrders.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-4 px-0.5 rounded-full bg-white text-black text-[8px] font-black flex items-center justify-center shadow-lg animate-pulse">
                  {activeCustomerOrders.length}
                </span>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsCartOpen(prev => !prev)}
            className="relative h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#800020] hover:text-white transition-all flex-shrink-0"
          >
            <ShoppingBag size={14} />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-0.5 rounded-full bg-[#d9ab7d] text-black text-[8px] font-black flex items-center justify-center shadow-lg">
                {cart.reduce((a, b) => a + b.qty, 0)}
              </span>
            )}
          </button>
        </>
      )}
    </div>
  </div>
</nav>

      {/* ── VIEWS ── */}
      <AnimatePresence mode="wait">

        {/* CUSTOMER VIEW */}
        {view === "customer" && (
          <motion.main key="customer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative z-10 pt-20 pb-24 overflow-x-hidden w-full max-w-[1600px] mx-auto will-change-auto">
            {/* HERO */}
            <div className="relative h-[55vh] sm:h-[65vh] overflow-hidden mb-0">
              {brewGallery.map((img, idx) => (
                <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: idx === heroIndex ? 1 : 0 }} transition={{ duration: 1.2, ease: "easeInOut" }} className="absolute inset-0">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
                </motion.div>
              ))}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {brewGallery.map((_, idx) => (<button key={idx} type="button" onClick={() => setHeroIndex(idx)} className={`rounded-full transition-all duration-500 ${idx === heroIndex ? "w-6 h-2 bg-[#d9ab7d]" : "w-2 h-2 bg-white/30"}`} />))}
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-10">
                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-[9px] sm:text-[10px] tracking-[0.35em] uppercase text-zinc-400 mb-3 font-bold">{lang === "ar" ? "قهوة مختصة فاخرة · تجربة استثنائية" : "Specialty Coffee Roasters · Madinah"}</motion.p>
                <motion.h2 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-4xl sm:text-6xl lg:text-8xl font-black tracking-tighter leading-none mb-5">
                  {lang === "ar" ? "شغف الحبة" : "Crafted For"}<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d9ab7d] via-zinc-100 to-[#b8895f] italic">{lang === "ar" ? "فخامة التقديم" : "Quiet Luxury"}</span>
                </motion.h2>
                <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} type="button"
                  onClick={() => { const el = document.getElementById('menu-section'); el?.scrollIntoView({ behavior: 'smooth' }); }}
                  className="h-12 px-8 rounded-full bg-white text-black font-black text-xs uppercase tracking-widest hover:bg-[#d9ab7d] transition-all shadow-2xl">
                  {lang === "ar" ? "اطلب الآن" : "Order Now"}
                </motion.button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-md border-t border-white/5 py-3 px-6 z-10">
                <div className="max-w-4xl mx-auto flex items-center justify-center gap-6 sm:gap-10 flex-wrap">
                  {[{ icon: "☕", en: "Specialty Coffee", ar: "قهوة مختصة" }, { icon: "⭐", en: "4.4 Rating (373)", ar: "تقييم 4.4" }, { icon: "🪑", en: "Dine-in & Takeaway", ar: "داخلي وخارجي" }, { icon: "🅿️", en: "Free Parking", ar: "موقف مجاني" }].map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[10px] text-zinc-300 font-bold"><span>{item.icon}</span><span>{lang === "ar" ? item.ar : item.en}</span></div>
                  ))}
                </div>
              </div>
            </div>

            {/* ACTIVE EVENT BANNER */}
            <AnimatePresence>{activeEvent && <ActiveEventBanner event={activeEvent} lang={lang} />}</AnimatePresence>

            {/* MENU SECTION */}
            <div id="menu-section" className="px-4 sm:px-6 lg:px-8 pt-4">
              {/* PROMO BLOCK — above search, below event banner */}
              <AnimatePresence>
                {promoBlock.active && (
                  <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="mb-6">
                    <div className="relative rounded-3xl overflow-hidden" style={{ background: `linear-gradient(135deg,${promoBlock.bgColor}e0 0%,#0d0d0d 55%,${promoBlock.bgColor}30 100%)`, boxShadow: `0 0 60px 0 ${promoBlock.bgColor}30,0 2px 20px 0 #00000080`, border: `1px solid ${promoBlock.bgColor}40` }}>
                      <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle,${promoBlock.bgColor}50 0%,transparent 70%)`, filter: "blur(40px)" }} />
                      <div className="relative z-10 p-6 sm:p-8">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                          <div className="flex items-start gap-5">
                            <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-3xl select-none" style={{ background: `${promoBlock.bgColor}60`, border: `1px solid ${promoBlock.bgColor}80` }}>{promoBlock.emoji}</div>
                            <div>
                              <p className="text-[9px] uppercase tracking-[0.35em] font-black mb-1.5" style={{ color: promoBlock.bgColor === "#800020" ? "#d9ab7d" : "rgba(255,255,255,0.5)" }}>{lang === "ar" ? "عروض وفعاليات" : "Promotions & Activities"}</p>
                              <h3 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight mb-2">{lang === "ar" ? promoBlock.titleAr : promoBlock.titleEn}</h3>
                              <p className="text-sm text-white/65 leading-relaxed max-w-md">{lang === "ar" ? promoBlock.bodyAr : promoBlock.bodyEn}</p>
                            </div>
                          </div>
                          {(promoBlock.ctaEn || promoBlock.ctaAr) && (
                            <div className="flex-shrink-0 ltr:ml-auto rtl:mr-auto">
                              {promoBlock.ctaUrl
                                ? <a href={promoBlock.ctaUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 h-12 px-7 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-widest hover:bg-[#d9ab7d] transition-all shadow-xl whitespace-nowrap group"><span>{lang === "ar" ? promoBlock.ctaAr : promoBlock.ctaEn}</span><span className="text-base group-hover:translate-x-0.5 transition-transform">→</span></a>
                                : <button type="button" onClick={() => { const el = document.getElementById('menu-section'); el?.scrollIntoView({ behavior: 'smooth' }); }} className="inline-flex items-center gap-2 h-12 px-7 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-widest hover:bg-[#d9ab7d] transition-all shadow-xl whitespace-nowrap group"><span>{lang === "ar" ? promoBlock.ctaAr : promoBlock.ctaEn}</span><span className="text-base group-hover:translate-x-0.5 transition-transform">→</span></button>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* SEARCH */}
              <div className="mb-4">
                <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl px-5 flex items-center gap-3 h-14 focus-within:border-zinc-600 transition-colors">
                  <Search size={18} className="text-zinc-500 flex-shrink-0" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder={lang === "ar" ? "ابحث عن خيارك المفضل..." : "Search the menu..."} className="bg-transparent flex-1 outline-none text-sm placeholder-zinc-600 text-white min-w-0" />
                  {search && <button type="button" onClick={() => setSearch("")} className="text-zinc-500 hover:text-white flex-shrink-0 transition-colors"><X size={16} /></button>}
                </div>
              </div>

              {/* CATEGORY TABS */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
                {["all", "hot", "cold", "dessert", "breakfast"].map(cat => (
                  <button key={cat} type="button" onClick={() => setActiveCategory(cat)}
                    className={`h-11 px-5 rounded-xl text-xs uppercase tracking-widest font-black transition-all border cursor-pointer select-none flex-shrink-0 ${activeCategory === cat ? "bg-[#800020] border-[#800020] text-white shadow-lg shadow-[#800020]/20" : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}>
                    {lang === "ar" ? (cat === "all" ? "الكل" : cat === "hot" ? "ساخن" : cat === "cold" ? "بارد" : cat === "dessert" ? "الحلويات" : "الإفطار") : cat}
                  </button>
                ))}
              </div>

              {/* MENU ROWS */}
              {filteredMenu.length === 0 ? (
                <div className="text-center py-20 text-zinc-600 flex flex-col items-center justify-center">
                  <Search size={40} className="mb-3 opacity-30" />
                  <p className="text-sm font-bold">{lang === "ar" ? "لا توجد نتائج مطابقة" : "No items match your search."}</p>
                </div>
              ) : (
                <div className="space-y-6 mb-6">
                  {menuRows.map((row, rowIdx) => <div key={rowIdx}><MenuRowCarousel items={row} lang={lang} onAdd={addToCart} /></div>)}
                </div>
              )}

              {/* LOCATION + WHATSAPP */}
              <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl p-5 border border-zinc-800 bg-zinc-950/40 backdrop-blur-md">
                  <MapPin className="text-[#d9ab7d] mb-3" size={22} />
                  <h4 className="font-black text-sm uppercase tracking-wider mb-2">{lang === "ar" ? "موقعنا" : "Madinah Regional Hub"}</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">Aseed bin Kaab, Mudhainib, Madinah 42381</p>
                  <a href="https://maps.app.goo.gl/u6i4p214iJBuzxKTA" target="_blank" rel="noreferrer" className="inline-flex h-9 px-4 items-center bg-zinc-900 hover:bg-[#800020] text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors">{lang === "ar" ? "فتح خرائط جوجل" : "Navigate via GPS"}</a>
                </div>
                <div className="rounded-2xl p-5 border border-zinc-800 bg-zinc-950/40 backdrop-blur-md flex flex-col justify-between">
                  <div>
                    <Bot className="text-emerald-400 mb-3" size={22} />
                    <h4 className="font-black text-sm uppercase tracking-wider mb-2">{lang === "ar" ? "الدعم عبر واتساب" : "WhatsApp Support"}</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed mb-4">{lang === "ar" ? "تواصل مباشر لتأكيد الطلبات وأي استفسار." : "Direct support and order confirmation."}</p>
                  </div>
                  <a href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`} className="inline-flex h-9 px-4 items-center bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-600 hover:text-white transition-all max-w-max">{lang === "ar" ? "تواصل معنا" : "Chat Now"}</a>
                </div>
              </section>

              <footer className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
                <p onClick={() => switchView("login")} className="text-xs text-zinc-600 font-medium cursor-pointer hover:text-zinc-400 transition-colors">{lang === "ar" ? "حقوق الطبع © 2026 بريو كافيه. جميع الحقوق محفوظة." : "© 2026 Brew Café. All Rights Reserved."}</p>
              </footer>
            </div>
          </motion.main>
        )}

        {/* LOGIN VIEW */}
        {view === "login" && (
          <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[999] bg-zinc-950/95 backdrop-blur-3xl flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8 text-center shadow-2xl">
              <Lock size={32} className="mx-auto mb-4 text-[#d9ab7d]" />
              <h3 className="text-base font-black tracking-widest uppercase mb-1">{lang === "ar" ? "بوابة الدخول الآمنة" : "Secure Access Portal"}</h3>
              <p className="text-[10px] text-zinc-500 mb-5">{lang === "ar" ? "أدخل الرمز السري للمتابعة" : "Enter your PIN to continue"}</p>
              <input autoFocus type="password" maxLength={4} value={pin} onChange={e => { setPin(e.target.value); setPinError(""); }} placeholder="••••"
                className={`w-full h-14 rounded-xl bg-black border text-center text-3xl font-mono tracking-[0.5em] text-white outline-none ${pinError ? "border-red-600 focus:border-red-500" : "border-zinc-800 focus:border-[#800020]"}`} />
              {pinError && <p className="mt-2 text-red-400 text-xs font-bold">{pinError}</p>}
              <div className="mt-4 text-center">
                <button type="button" onClick={() => setIsPinRecoveryOpen(!isPinRecoveryOpen)} className="text-[10px] text-zinc-400 hover:text-[#d9ab7d] flex items-center justify-center gap-1 mx-auto">
                  <HelpCircle size={11} /><span>{lang === "ar" ? "نسيت الرمز السري؟" : "Forgot your PIN?"}</span>
                </button>
                {isPinRecoveryOpen && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-2 p-3 bg-black/40 rounded-lg border border-zinc-800 text-[10px] text-zinc-400 leading-relaxed">
                    {lang === "ar" ? "من فضلك كلم المالك او الإدارة" : "The default PIN is 1234. You can change it from the Owner Dashboard."}
                  </motion.div>
                )}
              </div>
              <button type="button" onClick={() => switchView("customer")} className="mt-6 text-[10px] uppercase tracking-widest font-black text-zinc-500 hover:text-white transition-colors block mx-auto cursor-pointer">{lang === "ar" ? "إلغاء والعودة" : "Cancel & Return"}</button>
              <div className="mt-10 pt-4 border-t border-zinc-900 select-none">
                <p className="text-[10px] font-bold text-zinc-600 tracking-wider">Built by SM WEB DESIGN</p>
                <p className="text-[9px] text-zinc-800 tracking-widest mt-1 font-mono" dir="ltr">+1 (437) 449-3389</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* HUB VIEW */}
        {view === "hub" && (
          <motion.div key="hub" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[999] bg-black p-4 sm:p-8 flex items-center justify-center">
            <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <button type="button" onClick={() => switchView("staff")} className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-6 ltr:text-left rtl:text-right hover:border-zinc-700 transition-all group relative cursor-pointer">
                <ChefHat size={30} className="text-zinc-400 group-hover:text-white mb-4 transition-colors" />
                <h3 className="text-xl font-black mb-2 text-white">{lang === "ar" ? "لوحة الموظفين" : "Staff Dashboard"}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{lang === "ar" ? "إدارة الطلبات في الوقت الفعلي وتتبع المطبخ." : "Real-time order fulfillment and kitchen tracking."}</p>
              </button>
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-6 flex flex-col justify-between">
                <div>
                  <LayoutDashboard size={30} className="text-[#d9ab7d] mb-4" />
                  <h3 className="text-xl font-black mb-2 text-white">{lang === "ar" ? "مركز تحكم المالك" : "Owner Control Center"}</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed mb-4">{lang === "ar" ? "يتطلب رمز التحقق الثانوي للدخول." : "Requires secondary verification PIN."}</p>
                </div>
                {!isSuperAdminVerified ? (
                  <div className="space-y-2 pt-2 border-t border-zinc-800">
                    <label className="block text-[9px] uppercase tracking-wider font-black text-zinc-400">{lang === "ar" ? "رمز التحقق:" : "Admin PIN:"}</label>
                    <div className="flex gap-2">
                      <input type="password" placeholder="••••" maxLength={4} value={superAdminPinInput} onChange={e => setSuperAdminPinInput(e.target.value)} className="h-10 w-24 rounded-lg bg-black border border-zinc-800 text-center font-mono text-xs tracking-widest text-white outline-none" />
                      <button type="button" onClick={() => { if (superAdminPinInput === ownerPin) { setIsSuperAdminVerified(true); switchView("owner"); setSuperAdminPinInput(""); } else { showToast("Incorrect PIN.", "error", "hub-pin-fail"); setSuperAdminPinInput(""); } }} className="h-10 px-4 rounded-lg bg-[#800020] text-white text-[10px] font-black uppercase tracking-wider flex-1 cursor-pointer">{lang === "ar" ? "تحقّق" : "Verify"}</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => switchView("owner")} className="h-10 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest cursor-pointer">{lang === "ar" ? "دخول لوحة التحكم" : "Enter Dashboard"}</button>
                )}
              </div>
              <button type="button" onClick={() => { switchView("customer"); setIsSuperAdminVerified(false); }} className="md:col-span-2 h-11 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-black tracking-widest text-zinc-400 hover:text-white uppercase transition-colors cursor-pointer">{lang === "ar" ? "العودة إلى القائمة" : "Return to Menu"}</button>
            </div>
          </motion.div>
        )}

        {/* STAFF VIEW */}
        {view === "staff" && (
          <motion.main key="staff" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-24 pb-20 px-4 w-full max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-[10px] uppercase text-zinc-500 tracking-widest">{lang === "ar" ? "تحديث مباشر" : "Live Kitchen View"}</p>
                <h2 className="text-2xl sm:text-3xl font-black">{lang === "ar" ? "شاشة المطبخ" : "Staff Dashboard"}</h2>
              </div>
              <button type="button" onClick={() => switchView("hub")} className="h-10 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold hover:bg-zinc-800 cursor-pointer">{lang === "ar" ? "تغيير العرض" : "Switch View"}</button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4 text-center">
              {ORDER_STATUSES.map(st => {
                const count = orders.filter(o => o.status === st).length;
                const labels: Record<string, { en: string; ar: string }> = { Queued: { en: "Queued", ar: "انتظار" }, Preparing: { en: "Preparing", ar: "تحضير" }, Ready: { en: "Ready", ar: "جاهز" }, Cancelled: { en: "Cancelled", ar: "ملغي" }, Delivered: { en: "Delivered", ar: "مكتمل" } };
                return (
                  <div key={st} className="bg-zinc-900/40 border border-zinc-800 p-2.5 rounded-xl">
                    <p className="text-[9px] uppercase text-zinc-500 tracking-tight font-black">{labels[st]?.[lang as "en" | "ar"] || st}</p>
                    <p className="text-base font-black mt-0.5 text-[#d9ab7d]">{count}</p>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-1.5 mb-5 overflow-x-auto scrollbar-none pb-1">
              {[{ key: "active", en: "Active", ar: "النشطة" }, { key: "Queued", en: "Queued", ar: "انتظار" }, { key: "Preparing", en: "Preparing", ar: "تحضير" }, { key: "Ready", en: "Ready", ar: "جاهز" }, { key: "all", en: "All", ar: "الكل" }].map(f => (
                <button key={f.key} type="button" onClick={() => setStaffFilter(f.key)} className={`h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider flex-shrink-0 transition-all cursor-pointer border ${staffFilter === f.key ? "bg-[#800020] border-[#800020] text-white" : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}>{lang === "ar" ? f.ar : f.en}</button>
              ))}
              {lateOrdersCount > 0 && <div className="h-9 px-4 rounded-xl bg-red-950/40 border border-red-800 text-red-400 text-[10px] font-black flex items-center gap-1.5 flex-shrink-0 animate-pulse"><AlertTriangle size={11} />{lateOrdersCount}{lang === "ar" ? " متأخر" : " Late"}</div>}
            </div>
            <div className="space-y-4">
              {staffVisibleOrders.map(order => {
                const elapsedMinutes = order.created_at ? Math.floor((Date.now() - order.created_at) / 60000) : 0;
                const isDelayed = elapsedMinutes >= 5 && order.status !== "Delivered" && order.status !== "Cancelled";
                const statusLabels: Record<string, { en: string; ar: string }> = { Queued: { en: "Queued", ar: "انتظار" }, Preparing: { en: "Preparing", ar: "تحضير" }, Ready: { en: "Ready", ar: "جاهز" }, Cancelled: { en: "Cancelled", ar: "ملغي" }, Delivered: { en: "Delivered", ar: "مسلّم" } };
                const cardBorder = isDelayed ? "border-red-800/60 bg-red-950/10" : order.status === "Ready" ? "border-emerald-800/40 bg-emerald-950/10" : order.status === "Preparing" ? "border-blue-800/40 bg-blue-950/10" : order.status === "Cancelled" ? "bg-zinc-950/20 border-zinc-900 opacity-60" : "bg-zinc-900/60 border-zinc-800";
                return (
                  <div key={order.id} className={`p-4 sm:p-5 rounded-2xl border transition-all ${cardBorder}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="font-mono text-xs font-black text-[#d9ab7d]">#{order.id}</span>
                          <span className="text-xs font-bold text-white px-2 py-0.5 rounded bg-zinc-800 capitalize">{statusLabels[order.status]?.[lang as "en" | "ar"] || order.status}</span>
                          <span className="text-xs text-zinc-400 font-bold">{order.customer}</span>
                          <span className="text-[11px] text-zinc-600 font-mono">({order.phone})</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase ${order.paymentStatus === "paid" ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : order.paymentStatus === "refunded" ? "bg-zinc-900 text-zinc-400 border border-zinc-700" : "bg-amber-950 text-amber-400 border border-amber-800"}`}>{order.paymentMethod?.toUpperCase()} · {order.paymentStatus?.toUpperCase()}</span>
                          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-black ${isDelayed ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse" : "bg-[#800020]/30 text-zinc-300 border border-[#800020]/40"}`}>
                            <Clock3 size={11} className={isDelayed ? "text-red-400" : "text-[#d9ab7d]"} />
                            <span>{elapsedMinutes}{lang === "ar" ? " دقيقة" : " MIN"}</span>
                          </div>
                        </div>
                        <div className="space-y-1 my-3">{order.items.map((it, idx) => <p key={idx} className="text-base font-black text-white">{it.qty}x {it.name}</p>)}</div>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500 font-medium">
                          <span>🚚 <strong className="text-zinc-300 capitalize">{order.method === "pickup" ? (lang === "ar" ? "استلام" : "Pickup") : (lang === "ar" ? "توصيل" : "Delivery")}</strong></span>
                          {order.method === "delivery" && order.deliveryAddress && <span className="text-blue-400 text-[10px]">📍 {order.deliveryAddress}{order.deliveryArea ? ` · ${order.deliveryArea}` : ""}{order.deliveryLandmark ? ` · ${order.deliveryLandmark}` : ""}</span>}
                          <span>💰 <strong className="text-zinc-300">{order.total.toFixed(2)} SAR</strong></span>
                          {order.notes && <span className="text-amber-400 italic">📝 {order.notes}</span>}
                        </div>
                      </div>
                      <div className="flex flex-wrap sm:flex-col items-end gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                        <div className="flex flex-wrap gap-1.5">
                          {order.status === "Queued" && <button type="button" onClick={() => updateOrderStatusCloud(order.id, "Preparing")} className="h-9 px-3 rounded-lg bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider cursor-pointer">{lang === "ar" ? "تحضير" : "PREPARE"}</button>}
                          {order.status !== "Ready" && order.status !== "Delivered" && order.status !== "Cancelled" && <button type="button" onClick={() => updateOrderStatusCloud(order.id, "Ready")} className="h-9 px-3 rounded-lg bg-white text-black text-[10px] font-black uppercase tracking-wider cursor-pointer">{lang === "ar" ? "جاهز" : "READY"}</button>}
                          {order.status !== "Cancelled" && order.status !== "Delivered" && <button type="button" onClick={() => updateOrderStatusCloud(order.id, "Cancelled", order.status)} className="h-9 px-3 rounded-lg bg-red-950/60 border border-red-800 text-red-400 text-[10px] font-black uppercase tracking-wider cursor-pointer">{lang === "ar" ? "إلغاء" : "CANCEL"}</button>}
                          {order.status === "Cancelled"
                            ? <button type="button" onClick={() => updateOrderStatusCloud(order.id, order.previousStatus || "Queued", null)} className="h-9 px-3 rounded-lg bg-zinc-800 border border-zinc-700 text-[#d9ab7d] text-[10px] font-black uppercase tracking-wider flex items-center gap-1 hover:bg-zinc-700 transition-colors cursor-pointer"><RotateCcw size={12} />{lang === "ar" ? "تراجع" : "UNDO"}</button>
                            : <button type="button" onClick={() => { if (order.method === "delivery" && order.status !== "Out for Delivery") updateOrderStatusCloud(order.id, "Out for Delivery"); else updateOrderStatusCloud(order.id, "Delivered"); }} className="h-9 px-3 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider cursor-pointer">{order.method === "delivery" && order.status !== "Out for Delivery" ? (lang === "ar" ? "مع الديليفري" : "OUT FOR DELIVERY") : (lang === "ar" ? "إتمام" : "DONE")}</button>
                          }
                          {order.paymentMethod === "cash" && order.paymentStatus === "pending" && <button type="button" onClick={() => updatePaymentStatus(order.id, "paid")} className="h-9 px-3 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1"><CheckCircle2 size={12} />{lang === "ar" ? "استلمت الكاش" : "CASH RECEIVED"}</button>}
                          <button type="button" onClick={() => printReceipt(order, lang)} className="h-9 px-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1 hover:text-white hover:bg-zinc-700 transition-colors"><Printer size={12} />{lang === "ar" ? "طباعة" : "PRINT"}</button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {staffVisibleOrders.length === 0 && <div className="text-center py-16 text-zinc-600"><ChefHat size={40} className="mx-auto mb-3 opacity-30" /><p className="text-sm font-bold">{lang === "ar" ? "لا توجد طلبات في هذه الفئة" : "No orders in this category."}</p></div>}
            </div>
          </motion.main>
        )}

        {/* OWNER VIEW */}
        {view === "owner" && (
          <motion.main key="owner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="pt-20 min-h-screen flex flex-col lg:flex-row w-full max-w-full overflow-x-hidden">
            {/* SIDEBAR */}
            <div className={`border-b lg:border-b-0 ${lang === "ar" ? "lg:border-l lg:border-r-0" : "lg:border-r lg:border-l-0"} border-zinc-800 bg-zinc-950/60 backdrop-blur-md transition-all duration-300 w-full lg:block flex-shrink-0 ${sidebarOpen ? "lg:w-56" : "lg:w-16"}`}>
              <div className="p-3 hidden lg:block">
                <button type="button" onClick={() => setSidebarOpen(!sidebarOpen)} className="h-9 w-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto cursor-pointer">
                  {sidebarOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
                </button>
              </div>
              <div className="p-2 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1 pb-3 lg:pb-6">
                {[{ key: "overview", icon: Cpu, labelEn: "Dashboard", labelAr: "لوحة التحكم" }, { key: "orders", icon: Receipt, labelEn: "Orders", labelAr: "الطلبات" }, { key: "menu", icon: Database, labelEn: "Menu", labelAr: "المنيو" }, { key: "promo", icon: Megaphone, labelEn: "Promotions", labelAr: "العروض" }, { key: "events", icon: Calendar, labelEn: "Events", labelAr: "المناسبات" }, { key: "settings", icon: Settings, labelEn: "Settings", labelAr: "الإعدادات" }].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button key={tab.key} type="button" onClick={() => setOwnerTab(tab.key)} className={`h-10 rounded-xl flex items-center gap-2.5 px-3 transition-all whitespace-nowrap text-xs cursor-pointer ${ownerTab === tab.key ? "bg-[#800020] text-white font-black" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"}`}>
                      <Icon size={13} />{(sidebarOpen || isMobile) && <span>{lang === "ar" ? tab.labelAr : tab.labelEn}</span>}
                    </button>
                  );
                })}
                <button type="button" onClick={() => { switchView("hub"); setIsSuperAdminVerified(false); }} className="h-10 rounded-xl flex items-center gap-2.5 px-3 text-xs text-red-400 hover:bg-red-950/20 whitespace-nowrap lg:mt-6 cursor-pointer">
                  <LogOut size={13} />{(sidebarOpen || isMobile) && <span>{lang === "ar" ? "قفل الجلسة" : "Lock Session"}</span>}
                </button>
              </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden min-w-0">

              {ownerTab === "overview" && (
                <div className="space-y-6">
                  <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] tracking-widest text-zinc-500 uppercase font-black">BREW CAFÉ OS</p>
                      <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">{lang === "ar" ? "لوحة التحكم المباشرة" : "Live Command Dashboard"}</h2>
                    </div>
                    <div className="h-10 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-emerald-400 text-xs font-bold">
                      <ShieldCheck size={13} />{dbStatus === "Connected Successfully!" ? (lang === "ar" ? "متصل" : "Live") : (lang === "ar" ? "خطأ في الاتصال" : "Connection Error")}
                    </div>
                  </header>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {/* Revenue Card */}
                    <div className="p-5 rounded-2xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 flex flex-col justify-between min-h-[185px]">
                      <div className="flex justify-between items-center gap-2"><span className="text-[10px] tracking-wider uppercase text-zinc-500 font-bold">{lang === "ar" ? "الإيرادات" : "Revenue"}</span><DollarSign size={13} className="text-[#d9ab7d]" /></div>
                      <div className="flex flex-wrap gap-1 my-2 bg-black/50 p-1 rounded-xl border border-zinc-900/80">
                        {[{ key: "today", en: "Today", ar: "اليوم" }, { key: "week", en: "Week", ar: "أسبوع" }, { key: "month", en: "Month", ar: "شهر" }, { key: "6months", en: "6M", ar: "٦ش" }, { key: "1year", en: "1Y", ar: "سنة" }, { key: "all", en: "All", ar: "الكل" }].map(period => (
                          <button key={period.key} type="button" onClick={() => setRevenuePeriod(period.key)} className={`text-[8px] font-black uppercase tracking-tight px-1 py-1 rounded-lg transition-all flex-1 text-center cursor-pointer ${revenuePeriod === period.key ? "bg-[#800020] text-white shadow-md scale-105" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"}`}>{lang === "ar" ? period.ar : period.en}</button>
                        ))}
                      </div>
                      <div className="min-h-[38px]">
                        <AnimatePresence mode="wait">
                          <motion.div key={revenuePeriod + netRevenue} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} transition={{ duration: 0.15 }}>
                            <h3 className="text-2xl font-black text-white tracking-tight flex items-baseline gap-1">{netRevenue.toFixed(2)}<span className="text-xs text-zinc-500 font-bold uppercase">SAR</span></h3>
                          </motion.div>
                        </AnimatePresence>
                        <p className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1"><TrendingUp size={10} className="text-emerald-400" />{lang === "ar" ? "الصافي بعد الملغي" : "Net after cancelled orders"}</p>
                      </div>
                      <div className="pt-2 border-t border-zinc-800/60 flex justify-between text-[10px] text-zinc-500 font-bold">
                        <span>G: <span className="font-mono text-zinc-300">{grossRevenue.toFixed(0)}</span></span><span>C: <span className="font-mono text-red-400">-{cancelledRevenue.toFixed(0)}</span></span>
                      </div>
                    </div>
                    <div className="p-5 rounded-2xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 flex flex-col justify-between min-h-[140px]">
                      <div className="flex justify-between items-start"><span className="text-[10px] tracking-wider uppercase text-zinc-500 font-bold">{lang === "ar" ? "الطلبات النشطة" : "Active Orders"}</span><Zap size={13} className="text-[#d9ab7d]" /></div>
                      <div><h3 className="text-2xl font-black text-white font-mono">{activeOrdersCount} <span className="text-xs text-zinc-500">{lang === "ar" ? "نشط" : "Active"}</span></h3><p className="text-[10px] text-zinc-400 mt-1">~{activeOrdersCount > 0 ? activeOrdersCount * 3 : 2}{lang === "ar" ? " دق انتظار" : " min avg. wait"}</p></div>
                    </div>
                    <div className="p-5 rounded-2xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 flex flex-col justify-between min-h-[140px]">
                      <div className="flex justify-between items-start"><span className="text-[10px] tracking-wider uppercase text-zinc-500 font-bold">{lang === "ar" ? "متأخرة" : "Delayed Orders"}</span><BellRing size={13} className="text-red-400" /></div>
                      <div><h3 className="text-2xl font-black text-red-400 font-mono">{lateOrdersCount} <span className="text-xs text-zinc-600">{lang === "ar" ? "متأخر" : "Delayed"}</span></h3><p className="text-[10px] text-zinc-400 mt-1">{lang === "ar" ? "تجاوزت 5 دقائق" : "Over 5 minutes"}</p></div>
                    </div>
                    <div className="p-5 rounded-2xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 flex flex-col justify-between min-h-[140px]">
                      <div className="flex justify-between items-start"><span className="text-[10px] tracking-wider uppercase text-zinc-500 font-bold">{lang === "ar" ? "المنيو" : "Menu Items"}</span><Smartphone size={13} className="text-emerald-400" /></div>
                      <div><h3 className="text-2xl font-black text-emerald-400 font-mono">{menuData.length}</h3><p className="text-[10px] text-zinc-400 mt-1">{menuData.filter(m => m.inStock).length}{lang === "ar" ? " متوفر" : " in stock"}</p></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pt-2">
                    <div className="xl:col-span-2 rounded-2xl bg-zinc-950 border border-zinc-900 p-5">
                      <h4 className="text-xs font-black text-zinc-400 tracking-wider uppercase mb-4">{lang === "ar" ? "الأكثر مبيعاً" : "Top Selling Products"}</h4>
                      <div className="space-y-3.5">
                        {[...menuData].sort((a, b) => b.sold - a.sold).slice(0, 3).map(item => (
                          <div key={item.id} className="flex items-center gap-3 bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-800">
                            {item.img && <img src={item.img} className="w-12 h-12 rounded-lg object-cover" alt="" loading="lazy" />}
                            <div className="flex-1"><h5 className="font-bold text-sm text-white">{item.name?.[lang as keyof LocalizedString]}</h5><p className="text-[10px] text-zinc-500">{item.sold}{lang === "ar" ? " مبيعات" : " sold"}</p></div>
                            <span className="text-xs font-black font-mono text-[#d9ab7d]">{item.price} SAR</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-zinc-950 border border-zinc-900 p-5 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-black text-zinc-400 tracking-wider uppercase mb-3">{lang === "ar" ? "الصلاحيات" : "Role Permissions"}</h4>
                        <div className="space-y-1 text-[11px] text-zinc-400 font-medium">
                          <p className="flex items-center gap-2 text-emerald-400"><Check size={11} />{lang === "ar" ? "الباريستا: الطلبات فقط" : "Baristas: Orders Only"}</p>
                          <p className="flex items-center gap-2 text-emerald-400"><Check size={11} />{lang === "ar" ? "المشرف: معالجة الطلبات" : "Managers: Process Orders"}</p>
                          <p className="flex items-center gap-2 text-emerald-400"><Check size={11} />{lang === "ar" ? "المالك: صلاحية كاملة" : "Owner: Full Access"}</p>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-zinc-900 text-center"><p className="text-[10px] text-zinc-500">{orders.length}{lang === "ar" ? " إجمالي الطلبات" : " total orders"}</p></div>
                    </div>
                  </div>
                </div>
              )}

              {ownerTab === "orders" && (
                <div>
                  <h3 className="text-xl font-black mb-4">{lang === "ar" ? "سجل الطلبات" : "Orders Database"}</h3>
                  <div className="flex flex-col sm:flex-row gap-3 mb-5 p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800">
                    <div className="flex-1 bg-black border border-zinc-800 rounded-xl px-3 flex items-center gap-2 h-10">
                      <Search size={13} className="text-zinc-500 flex-shrink-0" />
                      <input value={orderSearch} onChange={e => setOrderSearch(e.target.value)} placeholder={lang === "ar" ? "بحث بالاسم أو رقم الطلب أو الجوال..." : "Search by name, order ID, or phone..."} className="bg-transparent flex-1 outline-none text-xs text-white placeholder-zinc-600 min-w-0" />
                      {orderSearch && <button type="button" onClick={() => setOrderSearch("")} className="text-zinc-500 hover:text-white"><X size={12} /></button>}
                    </div>
                    <div className="flex gap-2 items-center flex-wrap">
                      <div className="flex items-center gap-1.5 bg-black border border-zinc-800 rounded-xl px-3 h-10"><Calendar size={11} className="text-zinc-500 flex-shrink-0" /><input type="date" value={orderDateFrom} onChange={e => setOrderDateFrom(e.target.value)} className="bg-transparent outline-none text-[11px] text-zinc-300 w-32 cursor-pointer" /></div>
                      <span className="text-zinc-600 text-xs font-bold">→</span>
                      <div className="flex items-center gap-1.5 bg-black border border-zinc-800 rounded-xl px-3 h-10"><Calendar size={11} className="text-zinc-500 flex-shrink-0" /><input type="date" value={orderDateTo} onChange={e => setOrderDateTo(e.target.value)} className="bg-transparent outline-none text-[11px] text-zinc-300 w-32 cursor-pointer" /></div>
                      {(orderDateFrom || orderDateTo || orderSearch) && <button type="button" onClick={() => { setOrderSearch(""); setOrderDateFrom(""); setOrderDateTo(""); }} className="h-10 px-3 rounded-xl bg-zinc-800 text-zinc-400 text-[10px] font-black flex items-center gap-1 hover:bg-zinc-700 hover:text-white transition-all cursor-pointer"><RotateCcw size={11} />{lang === "ar" ? "مسح الفلتر" : "Clear Filter"}</button>}
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-500 mb-3 font-bold">{filteredOwnerOrders.length}{lang === "ar" ? " نتيجة" : " results"}{(orderSearch || orderDateFrom || orderDateTo) ? (lang === "ar" ? " — فلتر نشط" : " — filter active") : ""}</p>
                  <div className="space-y-3">
                    {filteredOwnerOrders.map(o => (
                      <div key={o.id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 flex flex-col sm:flex-row justify-between gap-3 text-xs">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-mono text-[#d9ab7d] font-bold">#{o.id} — {o.customer}</p>
                            <span className="text-zinc-500 font-normal">({o.phone})</span>
                            <span className="text-[10px] text-zinc-600 font-mono">{new Date(o.created_at).toLocaleString(lang === "ar" ? "ar-SA" : "en-US", { dateStyle: "short", timeStyle: "short" })}</span>
                          </div>
                          <p className="text-zinc-500 mb-2">{o.items.map(i => `${i.qty}x ${i.name}`).join(", ")}</p>
                          {o.notes && <p className="text-amber-400 text-[10px] italic mb-1">📝 {o.notes}</p>}
                          {o.method === "delivery" && o.deliveryAddress && <p className="text-blue-400 text-[10px] mb-1">📍 {o.deliveryAddress}{o.deliveryArea ? ` · ${o.deliveryArea}` : ""}{o.deliveryLandmark ? ` · ${o.deliveryLandmark}` : ""}</p>}
                          <div className="flex flex-wrap gap-2 text-[10px]">
                            <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 uppercase">{o.method}</span>
                            <span className={`px-2 py-0.5 rounded font-black uppercase ${o.paymentStatus === "paid" ? "bg-emerald-950 text-emerald-400" : o.paymentStatus === "refunded" ? "bg-zinc-800 text-zinc-400" : "bg-amber-950 text-amber-400"}`}>{o.paymentMethod} · {o.paymentStatus}</span>
                            <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">{o.status}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 min-w-[110px]">
                          <p className="font-black text-white">{o.total.toFixed(2)} SAR</p>
                          <div className="flex gap-1">
                            {o.paymentMethod === "cash" && o.paymentStatus === "pending" && <button type="button" onClick={() => updatePaymentStatus(o.id, "paid")} className="h-7 px-2 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 text-[9px] font-black cursor-pointer">{lang === "ar" ? "تم الاستلام" : "PAID"}</button>}
                            {o.paymentStatus === "paid" && o.status === "Cancelled" && <button type="button" onClick={() => updatePaymentStatus(o.id, "refunded")} className="h-7 px-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 text-[9px] font-black cursor-pointer">{lang === "ar" ? "مسترد" : "REFUND"}</button>}
                            <button type="button" onClick={() => printReceipt(o, lang)} className="h-7 w-7 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white flex items-center justify-center cursor-pointer"><Printer size={11} /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredOwnerOrders.length === 0 && <div className="text-center py-16 text-zinc-600"><Receipt size={40} className="mx-auto mb-3 opacity-30" /><p className="text-sm font-bold">{lang === "ar" ? "لا توجد طلبات" : "No orders found."}</p></div>}
                  </div>
                </div>
              )}

              {ownerTab === "menu" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black">{lang === "ar" ? "المنتجات والمخزون" : "Menu & Inventory"}</h3>
                    <button type="button" onClick={() => setIsDeployModalOpen(true)} className="h-9 px-4 rounded-lg bg-[#800020] text-xs font-black flex items-center gap-1.5 hover:bg-[#a0002c] transition-colors cursor-pointer"><PlusCircle size={13} />{lang === "ar" ? "إضافة منتج" : "Add Product"}</button>
                  </div>
                  {dbStatus !== "Connected Successfully!" && (
                    <div className="mb-4 p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-start gap-2">
                      <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-300 leading-relaxed"><strong>Supabase not connected.</strong> Enable anon SELECT/INSERT/UPDATE/DELETE on <code>brew_cafe_menu</code> and <code>brew_cafe_orders</code>.</p>
                    </div>
                  )}
                  <AnimatePresence>
                    {isDeployModalOpen && (
                      <motion.form initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ type: "spring", stiffness: 300, damping: 32 }}
                        onSubmit={deployProductListing} className="mb-6 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/80 space-y-4 max-w-4xl">
                        <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                          <h4 className="text-xs font-black uppercase text-[#d9ab7d]">{lang === "ar" ? "إضافة منتج جديد" : "Deploy New Product"}</h4>
                          <button type="button" onClick={() => { setIsDeployModalOpen(false); setListingErrors({}); }} className="text-zinc-500 hover:text-white cursor-pointer"><X size={16} /></button>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <div className="lg:col-span-2 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] text-zinc-400 mb-1 font-bold">{lang === "ar" ? "الاسم بالإنجليزية" : "English Name"} *</label>
                                <input required value={newListing.nameEn} onChange={e => { setNewListing({ ...newListing, nameEn: e.target.value }); setListingErrors(p => ({ ...p, nameEn: "" })); }} placeholder="e.g. V60 Coffee" className={`w-full h-9 px-3 bg-black border rounded-lg text-xs text-white outline-none ${listingErrors.nameEn ? "border-red-600" : "border-zinc-800"}`} />
                                {listingErrors.nameEn && <p className="text-red-400 text-[10px] mt-1">{listingErrors.nameEn}</p>}
                              </div>
                              <div>
                                <label className="block text-[10px] text-zinc-400 mb-1 font-bold">{lang === "ar" ? "الاسم بالعربية" : "Arabic Name"} *</label>
                                <input required value={newListing.nameAr} onChange={e => { setNewListing({ ...newListing, nameAr: e.target.value }); setListingErrors(p => ({ ...p, nameAr: "" })); }} placeholder="مثال: قهوة V60" className={`w-full h-9 px-3 bg-black border rounded-lg text-xs text-white outline-none text-right ${listingErrors.nameAr ? "border-red-600" : "border-zinc-800"}`} />
                                {listingErrors.nameAr && <p className="text-red-400 text-[10px] mt-1">{listingErrors.nameAr}</p>}
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] text-zinc-400 mb-1 font-bold">{lang === "ar" ? "صورة المنتج" : "Product Image"}</label>
                              <div className="flex gap-2">
                                <label className="flex-1 flex items-center justify-center gap-2 h-9 px-3 bg-zinc-900 border border-dashed border-zinc-700 rounded-lg text-xs text-zinc-400 hover:text-white hover:border-zinc-500 transition-all cursor-pointer">
                                  <Upload size={13} className={isUploading ? "animate-bounce text-[#d9ab7d]" : ""} />
                                  <span>{isUploading ? (lang === "ar" ? "جاري الرفع..." : "Uploading...") : (lang === "ar" ? "رفع صورة" : "Upload Image")}</span>
                                  <input type="file" accept="image/*" onChange={handleStorageBucketImageUpload} disabled={isUploading} className="hidden" />
                                </label>
                                <input value={newListing.imgUrl} onChange={e => setNewListing({ ...newListing, imgUrl: e.target.value })} placeholder="Or paste image URL..." className="w-1/2 h-9 px-3 bg-black border border-zinc-800 rounded-lg text-xs text-white outline-none font-mono text-[11px]" />
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[10px] text-zinc-400 mb-1 font-bold">{lang === "ar" ? "السعر (ريال)" : "Price (SAR)"} *</label>
                                <input required type="number" step="0.01" min="0.01" value={newListing.price} onChange={e => { setNewListing({ ...newListing, price: e.target.value }); setListingErrors(p => ({ ...p, price: "" })); }} placeholder="15" className={`w-full h-9 px-3 bg-black border rounded-lg text-xs text-white outline-none ${listingErrors.price ? "border-red-600" : "border-zinc-800"}`} />
                                {listingErrors.price && <p className="text-red-400 text-[10px] mt-1">{listingErrors.price}</p>}
                              </div>
                              <div>
                                <label className="block text-[10px] text-zinc-400 mb-1 font-bold">{lang === "ar" ? "السعرات" : "Calories"}</label>
                                <input type="number" min="0" value={newListing.kcal} onChange={e => setNewListing({ ...newListing, kcal: e.target.value })} placeholder="80" className="w-full h-9 px-3 bg-black border border-zinc-800 rounded-lg text-xs text-white outline-none" />
                              </div>
                              <div>
                                <label className="block text-[10px] text-zinc-400 mb-1 font-bold">{lang === "ar" ? "الفئة" : "Category"}</label>
                                <select value={newListing.cat} onChange={e => setNewListing({ ...newListing, cat: e.target.value })} className="w-full h-9 px-2 bg-black border border-zinc-800 rounded-lg text-xs text-white outline-none">
                                  <option value="hot">{lang === "ar" ? "ساخن" : "Hot"}</option>
                                  <option value="cold">{lang === "ar" ? "بارد" : "Cold"}</option>
                                  <option value="dessert">{lang === "ar" ? "حلويات" : "Dessert"}</option>
                                  <option value="breakfast">{lang === "ar" ? "الإفطار" : "Breakfast"}</option>
                                </select>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] text-zinc-400 mb-1 font-bold">{lang === "ar" ? "الوصف (إنجليزي)" : "English Description"}</label>
                                <textarea value={newListing.descEn} onChange={e => setNewListing({ ...newListing, descEn: e.target.value })} placeholder="Product description..." rows={2} className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-xs text-white outline-none resize-none" />
                              </div>
                              <div>
                                <label className="block text-[10px] text-zinc-400 mb-1 font-bold">{lang === "ar" ? "الوصف (عربي)" : "Arabic Description"}</label>
                                <textarea value={newListing.descAr} onChange={e => setNewListing({ ...newListing, descAr: e.target.value })} placeholder="وصف المنتج..." rows={2} className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-xs text-white outline-none resize-none text-right" />
                              </div>
                            </div>
                          </div>
                          <div className="bg-black/50 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center gap-1.5 text-zinc-400 mb-2"><Eye size={12} className="text-[#d9ab7d]" /><span className="text-[10px] font-bold uppercase tracking-wider">Preview</span></div>
                              <div className="relative h-36 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center">
                                {newListing.imgUrl?.trim() ? <img key={newListing.imgUrl} src={newListing.imgUrl} className="w-full h-full object-cover" alt="Preview" onError={e => { e.currentTarget.src = "https://placehold.co/400x300?text=Invalid+URL"; }} /> : <span className="text-[10px] text-zinc-600 p-4 text-center">No image yet</span>}
                              </div>
                            </div>
                            <p className="text-[9px] text-zinc-500 mt-2 leading-relaxed">Upload or paste a URL to preview.</p>
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end pt-2 border-t border-zinc-800">
                          <button type="button" onClick={() => { setIsDeployModalOpen(false); setListingErrors({}); }} className="h-9 px-4 bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer">{lang === "ar" ? "إلغاء" : "Cancel"}</button>
                          <button type="submit" disabled={isSyncing} className="h-9 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer disabled:opacity-50">{isSyncing ? (lang === "ar" ? "جاري الحفظ..." : "Saving...") : (lang === "ar" ? "نشر المنتج" : "Deploy Product")}</button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>
                  <div className="rounded-xl border border-zinc-800 overflow-x-auto bg-zinc-950/20">
                    <table className="w-full min-w-full text-xs text-left">
                      <thead className="bg-zinc-900/60 text-zinc-400">
                        <tr>
                          <th className="p-4 uppercase tracking-wider font-bold">{lang === "ar" ? "المنتج" : "Product"}</th>
                          <th className="p-4 uppercase tracking-wider font-bold">{lang === "ar" ? "السعر" : "Price"}</th>
                          <th className="p-4 uppercase tracking-wider font-bold">{lang === "ar" ? "المبيعات" : "Sold"}</th>
                          <th className="p-4 uppercase tracking-wider font-bold">{lang === "ar" ? "التوفر" : "Stock"}</th>
                          <th className="p-4 uppercase tracking-wider font-bold text-center">{lang === "ar" ? "حذف" : "Delete"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {menuData.map(item => (
                          <tr key={item.id} className="border-t border-zinc-900 hover:bg-zinc-900/20">
                            <td className="p-4 font-black text-white">
                              <div className="flex items-center gap-3">
                                {item.img && <img src={item.img} className="w-8 h-8 rounded object-cover border border-zinc-800" alt="" loading="lazy" />}
                                <div>{item?.name?.en}<span className="block font-normal text-[11px] text-zinc-500">{item?.name?.ar}</span></div>
                              </div>
                            </td>
                            <td className="p-4 font-mono font-bold text-[#d9ab7d]">{item.price} SAR</td>
                            <td className="p-4 font-mono text-zinc-400">{item.sold}</td>
                            <td className="p-4">
                              <button type="button" onClick={() => toggleStockStatusCloud(item.id, item?.inStock)} disabled={stockTogglingRef.current.has(item.id)}
                                className={`h-8 px-3 rounded-lg font-black text-[10px] uppercase transition-all cursor-pointer disabled:opacity-50 ${item?.inStock !== false ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-red-950 text-red-400 border border-red-800"}`}>
                                {item?.inStock !== false ? (lang === "ar" ? "متوفر" : "In Stock") : (lang === "ar" ? "نفذ" : "Out of Stock")}
                              </button>
                            </td>
                            <td className="p-4 text-center">
                              <button type="button" onClick={() => deleteFromMenu(item.id)} className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-900/40 transition-all flex items-center justify-center mx-auto cursor-pointer"><Trash2 size={13} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {ownerTab === "promo" && (
                <div className="max-w-2xl">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="text-[10px] tracking-widest text-zinc-500 uppercase font-black mb-1">BREW CAFÉ OS</p>
                      <h3 className="text-2xl font-black tracking-tight">{lang === "ar" ? "إدارة العروض والفعاليات" : "Promotions Manager"}</h3>
                      <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed max-w-sm">{lang === "ar" ? "يظهر أعلى قائمة المنيو — تحت بانر المناسبة." : "Displayed above the menu — below the event banner."}</p>
                    </div>
                    <div className={`flex-shrink-0 h-8 px-3 rounded-full text-[10px] font-black flex items-center gap-1.5 mt-1 ${promoBlock.active ? "bg-emerald-950 border border-emerald-800 text-emerald-400" : "bg-zinc-900 border border-zinc-800 text-zinc-500"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${promoBlock.active ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"}`} />
                      {promoBlock.active ? (lang === "ar" ? "مُفعّل" : "Live") : (lang === "ar" ? "مخفي" : "Hidden")}
                    </div>
                  </div>
                  {/* LIVE PREVIEW — reads from promoBlock (updates instantly with color changes) */}
                  <div className="mb-6">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-black mb-3 flex items-center gap-2"><Eye size={11} className="text-[#d9ab7d]" />{lang === "ar" ? "معاينة مباشرة" : "Live Preview"}</p>
                    <div className="relative rounded-2xl overflow-hidden transition-all duration-300"
                      style={{ background: `linear-gradient(135deg,${promoBlock.bgColor}e0 0%,#0d0d0d 55%,${promoBlock.bgColor}30 100%)`, border: `1px solid ${promoBlock.bgColor}50`, boxShadow: `0 0 40px ${promoBlock.bgColor}25` }}>
                      <div className="p-5 flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all duration-300" style={{ background: `${promoBlock.bgColor}50`, border: `1px solid ${promoBlock.bgColor}70` }}>{promoBlock.emoji}</div>
                        <div>
                          <h4 className="font-black text-sm text-white leading-tight mb-1">{lang === "ar" ? promoBlock.titleAr : promoBlock.titleEn}</h4>
                          <p className="text-xs text-white/60 leading-relaxed">{lang === "ar" ? promoBlock.bodyAr : promoBlock.bodyEn}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-5">
                    <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                      <h4 className="text-xs font-black uppercase text-[#d9ab7d] tracking-wider flex items-center gap-2"><Megaphone size={12} />{lang === "ar" ? "تحرير المحتوى" : "Edit Promotion"}</h4>
                      <button type="button" onClick={() => setPromoBlock(p => ({ ...p, active: !p.active }))}
                        className={`h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${promoBlock.active ? "bg-red-950/60 border border-red-800 text-red-400 hover:bg-red-900/60" : "bg-emerald-600 text-white hover:bg-emerald-500"}`}>
                        {promoBlock.active ? (lang === "ar" ? "إخفاء" : "Hide Now") : (lang === "ar" ? "تفعيل" : "Activate")}
                      </button>
                    </div>
                    <div className="flex items-end gap-4">
                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-1.5 font-bold uppercase tracking-wider">{lang === "ar" ? "الرمز" : "Emoji"}</label>
                        {/* Emoji updates both promoEdit and promoBlock for live preview */}
                        <input value={promoEdit.emoji} onChange={e => { setPromoEdit(p => ({ ...p, emoji: e.target.value })); setPromoBlock(p => ({ ...p, emoji: e.target.value })); }} placeholder="✨" maxLength={4}
                          className="w-16 h-12 text-2xl text-center bg-black border border-zinc-800 rounded-xl text-white outline-none focus:border-[#800020] transition-colors" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] text-zinc-400 mb-1.5 font-bold uppercase tracking-wider">{lang === "ar" ? "لون الهوية" : "Accent Color"}</label>
                        {/* FIX: Color swatches update BOTH promoEdit AND promoBlock so preview changes instantly */}
                        <div className="flex gap-2 items-center flex-wrap">
                          {["#800020", "#1a6b3c", "#1a3d6b", "#5a1a6b", "#6b4a1a", "#1a5a6b"].map(c => (
                            <button key={c} type="button"
                              onClick={() => { setPromoEdit(p => ({ ...p, bgColor: c })); setPromoBlock(p => ({ ...p, bgColor: c })); }}
                              style={{ background: c }}
                              className={`h-9 w-9 rounded-xl border-2 transition-all cursor-pointer shadow-md ${promoEdit.bgColor === c ? "border-white scale-110 shadow-lg ring-2 ring-white/30" : "border-transparent hover:scale-105 hover:border-white/40"}`} />
                          ))}
                          <input type="color" value={promoEdit.bgColor}
                            onChange={e => { setPromoEdit(p => ({ ...p, bgColor: e.target.value })); setPromoBlock(p => ({ ...p, bgColor: e.target.value })); }}
                            title="Custom color" className="h-9 w-9 rounded-xl cursor-pointer border border-zinc-700 bg-black" />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-1.5 font-bold uppercase tracking-wider">{lang === "ar" ? "العنوان (EN)" : "Title (English)"}</label>
                        <input value={promoEdit.titleEn} onChange={e => setPromoEdit(p => ({ ...p, titleEn: e.target.value }))} placeholder="This Week's Special" className="w-full h-10 px-3 bg-black border border-zinc-800 rounded-xl text-xs text-white outline-none focus:border-[#800020] transition-colors" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-1.5 font-bold uppercase tracking-wider">{lang === "ar" ? "العنوان (AR)" : "Title (Arabic)"}</label>
                        <input value={promoEdit.titleAr} onChange={e => setPromoEdit(p => ({ ...p, titleAr: e.target.value }))} placeholder="عرض هذا الأسبوع" className="w-full h-10 px-3 bg-black border border-zinc-800 rounded-xl text-xs text-white outline-none focus:border-[#800020] transition-colors text-right" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-1.5 font-bold uppercase tracking-wider">{lang === "ar" ? "النص (EN)" : "Body (English)"}</label>
                        <textarea value={promoEdit.bodyEn} onChange={e => setPromoEdit(p => ({ ...p, bodyEn: e.target.value }))} placeholder="Describe the promotion or offer..." rows={3} className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-xl text-xs text-white outline-none resize-none focus:border-[#800020] transition-colors" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-1.5 font-bold uppercase tracking-wider">{lang === "ar" ? "النص (AR)" : "Body (Arabic)"}</label>
                        <textarea value={promoEdit.bodyAr} onChange={e => setPromoEdit(p => ({ ...p, bodyAr: e.target.value }))} placeholder="اكتب وصف العرض أو الفعالية..." rows={3} className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-xl text-xs text-white outline-none resize-none focus:border-[#800020] transition-colors text-right" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-1.5 font-bold uppercase tracking-wider">{lang === "ar" ? "نص الزر (EN)" : "Button (EN)"}</label>
                        <input value={promoEdit.ctaEn} onChange={e => setPromoEdit(p => ({ ...p, ctaEn: e.target.value }))} placeholder="Order Now" className="w-full h-10 px-3 bg-black border border-zinc-800 rounded-xl text-xs text-white outline-none focus:border-[#800020] transition-colors" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-1.5 font-bold uppercase tracking-wider">{lang === "ar" ? "نص الزر (AR)" : "Button (AR)"}</label>
                        <input value={promoEdit.ctaAr} onChange={e => setPromoEdit(p => ({ ...p, ctaAr: e.target.value }))} placeholder="اطلب الآن" className="w-full h-10 px-3 bg-black border border-zinc-800 rounded-xl text-xs text-white outline-none focus:border-[#800020] transition-colors text-right" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-1.5 font-bold uppercase tracking-wider">{lang === "ar" ? "رابط الزر" : "Button URL"}</label>
                        <input value={promoEdit.ctaUrl} onChange={e => setPromoEdit(p => ({ ...p, ctaUrl: e.target.value }))} placeholder="https://..." className="w-full h-10 px-3 bg-black border border-zinc-800 rounded-xl text-xs text-white outline-none font-mono text-[11px] focus:border-[#800020] transition-colors" />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2 border-t border-zinc-800">
                      <button type="button"
                        onClick={() => {
                          setPromoBlock({ ...promoEdit, active: promoBlock.active });
                          showToast(lang === "ar" ? "تم حفظ العرض ونشره بنجاح" : "Promotion saved and published!", "success", "promo-saved");
                        }}
                        className="flex-1 h-11 rounded-xl bg-[#800020] text-white text-xs font-black uppercase tracking-wider cursor-pointer hover:bg-[#a0002c] transition-colors flex items-center justify-center gap-2">
                        <CheckCircle2 size={14} />{lang === "ar" ? "حفظ ونشر" : "Save & Publish"}
                      </button>
                      <button type="button"
                        onClick={() => { const reset = { ...DEFAULT_PROMO, active: promoBlock.active }; setPromoBlock(reset); setPromoEdit(reset); showToast(lang === "ar" ? "تمت إعادة التعيين إلى الافتراضي" : "Reset to defaults.", "info", "promo-reset"); }}
                        className="h-11 px-5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-black uppercase cursor-pointer hover:bg-zinc-700 hover:text-white transition-colors flex items-center gap-2">
                        <RotateCcw size={13} />{lang === "ar" ? "إعادة" : "Reset"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {ownerTab === "events" && (
                <div>
                  <div className="mb-8">
                    <p className="text-[10px] tracking-widest text-zinc-500 uppercase font-black mb-1">BREW CAFÉ OS</p>
                    <h3 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">{lang === "ar" ? "إدارة المناسبات والمظاهر" : "Event Theme Manager"}</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed max-w-lg">{lang === "ar" ? "فعّل مظهر المناسبة ليتحول شكل الموقع بالكامل — الألوان والخلفية والعناصر المتحركة — للعملاء فوراً." : "Activate an event theme to transform the entire customer experience instantly."}</p>
                  </div>
                  <AnimatePresence>
                    {activeEvent && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="mb-6 p-4 rounded-2xl border border-white/10 flex items-center justify-between gap-4 backdrop-blur-sm"
                        style={{ background: `${EVENT_META[activeEvent.id]?.glowColor}20`, borderColor: `${EVENT_META[activeEvent.id]?.accentColor}30` }}>
                        <div className="flex items-center gap-3">
                          <motion.div className="h-2.5 w-2.5 rounded-full" style={{ background: EVENT_META[activeEvent.id]?.accentColor || "#fff" }} animate={{ opacity: [1, 0.3, 1], scale: [1, 1.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                          <span className="text-sm font-black text-white">{lang === "ar" ? "المظهر النشط الآن:" : "Live Theme:"}</span>
                          <span className="text-sm font-black" style={{ color: EVENT_META[activeEvent.id]?.accentColor }}>{activeEvent.sticker}{lang === "ar" ? activeEvent.name.ar : activeEvent.name.en}</span>
                        </div>
                        <button type="button" onClick={() => setActiveEvent(null)} className="h-8 px-3 rounded-lg bg-white/10 border border-white/20 text-white text-[10px] font-black uppercase tracking-wider cursor-pointer hover:bg-white/20 transition-all flex items-center gap-1.5"><X size={11} />{lang === "ar" ? "إيقاف" : "Deactivate"}</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {ISLAMIC_EVENTS.map(ev => <EventCard key={ev.id} ev={ev} isActive={activeEvent?.id === ev.id} lang={lang} onToggle={() => setActiveEvent(activeEvent?.id === ev.id ? null : ev)} />)}
                  </div>
                  <div className="mt-8 p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800 flex items-start gap-3">
                    <Sparkles size={14} className="text-[#d9ab7d] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-black text-zinc-300 mb-1">{lang === "ar" ? "كيف يعمل نظام المظاهر؟" : "How do event themes work?"}</p>
                      <p className="text-[11px] text-zinc-500 leading-relaxed">{lang === "ar" ? "عند تفعيل مظهر، يتغير لون الخلفية بالكامل، وتظهر بانر المناسبة مع تأثيرات حركية وجزيئات عائمة. يتم حفظ الإعداد تلقائياً عبر جميع الأجهزة." : "When activated, the entire background transforms with animated particles and glow effects. Settings auto-sync across all devices."}</p>
                    </div>
                  </div>
                </div>
              )}

              {ownerTab === "settings" && (
                <div className="max-w-md space-y-6">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
                    <h3 className="text-lg font-black mb-1">{lang === "ar" ? "تغيير الرمز السري" : "Change Access PIN"}</h3>
                    <p className="text-xs text-zinc-500 mb-4">{lang === "ar" ? "الرمز مخزن بشكل آمن — الافتراضي: 1234" : "PIN stored securely — default is 1234"}</p>
                    <div className="space-y-3">
                      <div>
                        <input type="password" placeholder={lang === "ar" ? "الرمز السري الجديد (4 أرقام)" : "New 4-Digit PIN"} maxLength={4} value={pinChangeInput} onChange={e => { if (/^\d*$/.test(e.target.value)) setPinChangeInput(e.target.value); }} className="w-full h-10 px-3 bg-black border border-zinc-800 rounded-lg text-xs text-white outline-none focus:border-[#800020]" />
                        <p className="text-[10px] text-zinc-600 mt-1">{lang === "ar" ? "أرقام فقط، 4 خانات بالضبط" : "Digits only, exactly 4 characters"}</p>
                      </div>
                      <button type="button" onClick={() => { if (isValidPin(pinChangeInput)) { setOwnerPin(pinChangeInput); showToast("PIN updated successfully!", "success", "pin-updated"); setPinChangeInput(""); } else showToast("PIN must be exactly 4 digits.", "error", "pin-invalid"); }} className="h-10 w-full rounded-lg bg-[#800020] text-white text-xs font-black uppercase tracking-widest cursor-pointer hover:bg-[#a0002c] transition-colors">{lang === "ar" ? "حفظ الرمز الجديد" : "Save New PIN"}</button>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
                    <h3 className="text-sm font-black mb-1 text-white">{lang === "ar" ? "رقم واتساب الأوامر" : "WhatsApp Order Number"}</h3>
                    <p className="text-xs text-zinc-500 mb-3">{lang === "ar" ? "رقم استلام إشعارات الطلبات (أرقام فقط)" : "Number to receive order notifications (digits only)"}</p>
                    <div className="space-y-3">
                      <div>
                        <input type="text" placeholder="966502013071" value={whatsappNumber} onChange={e => { if (/^[0-9\s+\-]*$/.test(e.target.value)) setWhatsappNumber(e.target.value); }} className="w-full h-10 px-3 bg-black border border-zinc-800 rounded-lg text-xs font-mono text-white outline-none focus:border-[#800020]" />
                        <p className="text-[10px] text-zinc-600 mt-1">{lang === "ar" ? "مثال: 966502013071 (بدون +)" : "Example: 966502013071 (no + needed)"}</p>
                      </div>
                      <button type="button" onClick={() => { if (isValidWhatsapp(whatsappNumber)) showToast("WhatsApp number saved successfully.", "success", "wa-saved"); else showToast("Invalid WhatsApp number format.", "error", "wa-invalid"); }} className="h-9 w-full rounded-lg bg-zinc-800 text-zinc-200 text-xs font-black uppercase tracking-wider cursor-pointer hover:bg-zinc-700 transition-colors">{lang === "ar" ? "حفظ الرقم" : "Save Number"}</button>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-red-900/40 bg-red-950/10 p-6">
                    <h3 className="text-sm font-black mb-1 text-red-400">{lang === "ar" ? "منطقة الخطر: مسح الطلبات" : "Danger Zone: Clear Orders"}</h3>
                    <p className="text-xs text-zinc-500 mb-4">{lang === "ar" ? "هذا الإجراء يحذف جميع الطلبات نهائياً من قاعدة البيانات ولا يمكن التراجع عنه." : "This permanently deletes ALL orders from the database and cannot be undone."}</p>
                    <button type="button" onClick={() => setShowClearConfirm(true)} className="h-10 w-full rounded-lg bg-red-950/60 border border-red-800 text-red-400 text-xs font-black uppercase tracking-wider cursor-pointer hover:bg-red-900/60 transition-colors flex items-center justify-center gap-2"><RotateCcw size={13} />{lang === "ar" ? "مسح جميع الطلبات" : "Clear All Orders"}</button>
                  </div>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-4">
                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-2">{lang === "ar" ? "معلومات النظام" : "System Information"}</h4>
                    <div className="space-y-1 text-[11px] text-zinc-500">
                      <p>PIN: {lang === "ar" ? "مخزن بأمان في قاعدة البيانات" : "Stored securely in database"}</p>
                      <p>WhatsApp: {lang === "ar" ? "مخزن ومزامن عبر الأجهزة" : "Stored and synced across devices"}</p>
                      <p className="text-emerald-400/70 text-[10px]">{lang === "ar" ? "✓ جميع الإعدادات تتزامن تلقائياً عبر كل الأجهزة." : "✓ All settings sync automatically across all devices."}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.main>
        )}
      </AnimatePresence>

      {/* ── CART DRAWER ── */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 flex justify-end" style={{ zIndex: 8000 }}>
  {/* Backdrop */}
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    onClick={() => setIsCartOpen(false)}
    className="absolute inset-0 bg-black/75 backdrop-blur-sm cursor-pointer"
  />

  {/* Drawer panel */}
  <motion.div
    initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
    transition={{ type: "spring", damping: 25, stiffness: 200 }}
    className="relative w-full max-w-md h-full flex flex-col bg-zinc-950 ltr:border-l rtl:border-r border-zinc-800 shadow-2xl"
    style={{ zIndex: 8001 }}
  >
    {/* ── HEADER — sticky, never scrolls ── */}
    <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950">
      <div className="flex items-center gap-2">
        <ShoppingBag size={17} className="text-[#d9ab7d]" />
        <h3 className="font-black text-base text-white uppercase tracking-wider">
          {lang === "ar" ? "حقيبتك" : "Your Bag"}
        </h3>
        {cart.length > 0 && (
          <span className="h-5 px-2 rounded-full bg-[#800020] text-white text-[10px] font-black flex items-center">
            {cart.reduce((a, b) => a + b.qty, 0)}
          </span>
        )}
      </div>
      {/* ← BACK / CLOSE BUTTON */}
      <button
        type="button"
        onClick={() => setIsCartOpen(false)}
        className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs font-black hover:bg-zinc-700 active:scale-95 transition-all cursor-pointer"
      >
        <ChevronLeft size={16} />
        {lang === "ar" ? "رجوع" : "Back"}
      </button>
    </div>

    {/* ── SCROLLABLE CONTENT ── */}
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

      {cart.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag size={44} className="mx-auto mb-3 text-zinc-800" />
          <p className="text-xs text-zinc-500 font-medium">
            {lang === "ar" ? "حقيبتك فارغة" : "Your bag is empty."}
          </p>
          <p className="text-[10px] text-zinc-600 mt-1">
            {lang === "ar" ? "أضف منتجاً من القائمة" : "Add items from the menu to get started."}
          </p>
        </div>
      ) : (
        <>
          {/* Cart items */}
          {cart.map(item => (
            <div key={item.id} className="flex gap-3 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800">
              {item.img && <img src={item.img} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" alt="" />}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-black text-sm text-white leading-tight">{item.name[lang as keyof LocalizedString]}</h4>
                  <button type="button" onClick={() => deleteFromCart(item.id)}
                    className="h-7 w-7 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-800 flex items-center justify-center flex-shrink-0 transition-all">
                    <Trash2 size={13} />
                  </button>
                </div>
                <p className="text-[#d9ab7d] font-mono font-bold text-sm mt-0.5">{item.price} SAR</p>
                <div className="flex items-center gap-3 mt-2">
                  <button type="button" onClick={() => updateQty(item.id, -1)}
                    className="h-8 w-8 rounded-lg bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700 active:scale-90 transition-all">
                    <Minus size={13} />
                  </button>
                  <span className="font-mono font-black text-white text-sm w-6 text-center">{item.qty}</span>
                  <button type="button" onClick={() => updateQty(item.id, 1)}
                    className="h-8 w-8 rounded-lg bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700 active:scale-90 transition-all">
                    <Plus size={13} />
                  </button>
                  <span className="text-zinc-400 text-xs font-mono ml-auto">{(item.price * item.qty).toFixed(2)} SAR</span>
                </div>
              </div>
            </div>
          ))}

          {/* Order form */}
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <h4 className="text-[10px] uppercase font-black tracking-wider text-zinc-400">
              {lang === "ar" ? "بيانات الطلب" : "Order Details"}
            </h4>
            <div>
              <input type="text" required
                placeholder={lang === "ar" ? "الاسم الكريم *" : "Your Name *"}
                value={customerInfo.name}
                onChange={e => { setCustomerInfo({ ...customerInfo, name: e.target.value }); setCartErrors(p => ({ ...p, name: "" })); }}
                className={`w-full h-11 px-4 bg-black border rounded-xl text-sm text-white outline-none ${cartErrors.name ? "border-red-600" : "border-zinc-800 focus:border-[#800020]"}`} />
              {cartErrors.name && <p className="text-red-400 text-[10px] mt-1">{cartErrors.name}</p>}
            </div>
            <div>
              <input type="tel" required
                placeholder={lang === "ar" ? "رقم الجوال *" : "Phone Number *"}
                value={customerInfo.phone}
                onChange={e => { setCustomerInfo({ ...customerInfo, phone: e.target.value }); setCartErrors(p => ({ ...p, phone: "" })); }}
                className={`w-full h-11 px-4 bg-black border rounded-xl text-sm text-white outline-none ${cartErrors.phone ? "border-red-600" : "border-zinc-800 focus:border-[#800020]"}`} />
              {cartErrors.phone && <p className="text-red-400 text-[10px] mt-1">{cartErrors.phone}</p>}
            </div>
            <select value={customerInfo.method}
              onChange={e => setCustomerInfo({ ...customerInfo, method: e.target.value as "pickup" | "delivery" })}
              className="w-full h-11 px-4 bg-black border border-zinc-800 rounded-xl text-sm text-white outline-none focus:border-[#800020]">
              <option value="pickup">{lang === "ar" ? "استلام من الفرع" : "Pickup from Store"}</option>
              <option value="delivery">{lang === "ar" ? "توصيل للعنوان" : "Home Delivery"}</option>
            </select>
            <AnimatePresence>
              {customerInfo.method === "delivery" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-2 overflow-hidden">
                  <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-800/30 space-y-2">
                    <p className="text-[10px] font-black text-blue-400 uppercase flex items-center gap-1"><Navigation size={11} />Delivery Address</p>
                    <div>
                      <input type="text" required
                        placeholder={lang === "ar" ? "الشارع ورقم المبنى *" : "Street & building number *"}
                        value={customerInfo.deliveryAddress}
                        onChange={e => { setCustomerInfo({ ...customerInfo, deliveryAddress: e.target.value }); setCartErrors(p => ({ ...p, deliveryAddress: "" })); }}
                        className={`w-full h-10 px-3 bg-black border rounded-xl text-xs text-white outline-none ${cartErrors.deliveryAddress ? "border-red-600" : "border-zinc-800"}`} />
                      {cartErrors.deliveryAddress && <p className="text-red-400 text-[10px] mt-1">{cartErrors.deliveryAddress}</p>}
                    </div>
                    <input type="text" placeholder={lang === "ar" ? "الحي (اختياري)" : "District (optional)"}
                      value={customerInfo.deliveryArea}
                      onChange={e => setCustomerInfo({ ...customerInfo, deliveryArea: e.target.value })}
                      className="w-full h-10 px-3 bg-black border border-zinc-800 rounded-xl text-xs text-white outline-none" />
                    <input type="text" placeholder={lang === "ar" ? "معلم قريب (اختياري)" : "Landmark (optional)"}
                      value={customerInfo.deliveryLandmark}
                      onChange={e => setCustomerInfo({ ...customerInfo, deliveryLandmark: e.target.value })}
                      className="w-full h-10 px-3 bg-black border border-zinc-800 rounded-xl text-xs text-white outline-none" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <input type="text" maxLength={200}
              placeholder={lang === "ar" ? "ملاحظات خاصة (اختياري)" : "Special notes (optional)"}
              value={customerInfo.notes}
              onChange={e => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
              className="w-full h-11 px-4 bg-black border border-zinc-800 rounded-xl text-sm text-white outline-none focus:border-[#800020]" />

            {/* Payment */}
            <div>
              <p className="text-[10px] uppercase font-black tracking-wider text-zinc-400 mb-2">
                {lang === "ar" ? "طريقة الدفع" : "Payment Method"}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setCustomerInfo({ ...customerInfo, paymentMethod: "cash" })}
                  className={`h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-black uppercase border cursor-pointer active:scale-95 transition-all ${customerInfo.paymentMethod === "cash" ? "bg-[#800020] border-[#800020] text-white" : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500"}`}>
                  <Banknote size={16} />{lang === "ar" ? "كاش" : "Cash"}
                </button>
                <button type="button" onClick={() => setCustomerInfo({ ...customerInfo, paymentMethod: "online" })}
                  className={`h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-black uppercase border cursor-pointer active:scale-95 transition-all ${customerInfo.paymentMethod === "online" ? "bg-[#800020] border-[#800020] text-white" : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500"}`}>
                  <Smartphone size={16} />{lang === "ar" ? "موبايل" : "Mobile Pay"}
                </button>
              </div>
              {customerInfo.paymentMethod === "online" && (
                <p className="text-[10px] text-emerald-400 mt-2 font-bold">✓ WhatsApp will open to complete payment</p>
              )}
            </div>

            {/* Totals */}
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 font-mono text-sm space-y-1.5">
              <div className="flex justify-between text-zinc-400 text-xs"><span>Subtotal:</span><span>{subtotal.toFixed(2)} SAR</span></div>
              <div className="flex justify-between text-zinc-400 text-xs"><span>VAT (15%):</span><span>{vat.toFixed(2)} SAR</span></div>
              <div className="flex justify-between text-white font-black text-base pt-2 border-t border-zinc-700">
                <span>{lang === "ar" ? "الإجمالي" : "Total"}</span>
                <span className="text-[#d9ab7d]">{total.toFixed(2)} SAR</span>
              </div>
            </div>

            {/* Place order */}
            <button type="button" onClick={placeOrder} disabled={isOrderSending}
              className="w-full h-14 rounded-xl bg-gradient-to-r from-[#800020] to-[#b00020] text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-60 active:scale-[0.98] transition-all">
              <Zap size={16} />
              {isOrderSending
                ? (lang === "ar" ? "جاري الإرسال..." : "Sending...")
                : customerInfo.paymentMethod === "online"
                  ? (lang === "ar" ? "تأكيد وفتح واتساب" : "Confirm & Open WhatsApp")
                  : (lang === "ar" ? "تأكيد الطلب" : "Place Order")}
                </button>
              </div>
           </>
         )}
        </div>{/* end scrollable */}
       </motion.div>
      </div>
    )}
   </AnimatePresence>

      {/* ── PAST ORDERS MODAL — FIX: z-index 9000 guarantees it appears above everything ── */}
      <AnimatePresence>
        {isNotificationOpen && (
          <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9000 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsNotificationOpen(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm" style={{ zIndex: 9000 }} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className="relative w-full max-w-2xl max-h-[80vh] bg-zinc-950 border border-zinc-800 rounded-[28px] p-6 shadow-2xl flex flex-col overflow-hidden"
              style={{ zIndex: 9001 }}>
              <div className="flex items-center justify-between pb-4 border-b border-zinc-900 mb-4">
                <div className="flex items-center gap-2.5">
                  <BellRing size={15} className="text-[#d9ab7d] animate-pulse" />
                  <h3 className="text-sm font-black tracking-widest uppercase text-zinc-200">{lang === "ar" ? "طلباتك" : "Your Orders"}</h3>
                  {activeCustomerOrders.length > 0 && <span className="text-[10px] bg-[#800020] text-white px-2 py-0.5 rounded-full font-black">{activeCustomerOrders.length}{lang === "ar" ? " نشط" : " active"}</span>}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {pastOrders.map(pOrd => {
                    const liveOrder = orders.find(o => o.id === pOrd.id);
                    const currentStatus = liveOrder?.status || pOrd.status;
                    const isDelivery = (liveOrder?.method || pOrd.method) === "delivery";
                    const isActive = currentStatus !== "Delivered" && currentStatus !== "Cancelled";
                    const statusColor: Record<string, string> = { Queued: "text-amber-400", Preparing: "text-blue-400", Ready: "text-emerald-400", "Out for Delivery": "text-sky-400", Cancelled: "text-red-400", Delivered: "text-zinc-400" };
                    return (
                      <div key={pOrd.id} className={`rounded-2xl p-4 border flex flex-col justify-between shadow-lg transition-all ${isActive ? "bg-zinc-900/70 border-zinc-700" : "bg-zinc-900/30 border-zinc-800/60 opacity-60"}`}>
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">{isActive && <div className="h-1.5 w-1.5 rounded-full bg-[#d9ab7d] animate-pulse" />}<span className="font-black text-xs text-zinc-200">{pOrd.customer}</span></div>
                            <span className="font-mono text-[11px] font-black text-[#d9ab7d] bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-800">#{pOrd.id}</span>
                          </div>
                          <div className="text-zinc-300 text-xs space-y-1 mb-3 bg-black/30 p-2.5 rounded-xl border border-zinc-900/50">
                            {pOrd.items.map((it, idx) => <p key={idx} className="flex justify-between font-bold text-[11px]"><span className="text-zinc-400">• {it.name}</span><span className="text-zinc-500 font-mono">x{it.qty}</span></p>)}
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-2.5 border-t border-zinc-900 text-[10px]">
                          <span className="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-black tracking-wider uppercase text-[9px]">{pOrd.method === "pickup" ? (lang === "ar" ? "استلام" : "Pickup") : (lang === "ar" ? "توصيل" : "Delivery")}</span>
                          <span className={`font-black ${statusColor[currentStatus] || "text-zinc-400"}`}>
                            {currentStatus === "Queued" && (lang === "ar" ? "في الانتظار ⏳" : "Queued ⏳")}
                            {currentStatus === "Preparing" && (lang === "ar" ? "جاري التحضير ☕" : "Preparing ☕")}
                            {currentStatus === "Ready" && !isDelivery && (lang === "ar" ? "جاهز للاستلام ✓" : "Ready ✓")}
                            {currentStatus === "Ready" && isDelivery && (lang === "ar" ? "جاهز للتوصيل ✓" : "Ready for Delivery ✓")}
                            {currentStatus === "Out for Delivery" && (lang === "ar" ? "مع الديليفري 🛵" : "Out for Delivery 🛵")}
                            {currentStatus === "Cancelled" && (lang === "ar" ? "ملغي" : "Cancelled")}
                            {currentStatus === "Delivered" && (lang === "ar" ? "تم التسليم ✓" : "Delivered ✓")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}