import { useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { Calendar, CheckCircle2, MessageSquare, Palette, Send, Sparkles, Upload, Users } from "lucide-react";
import { toast } from "sonner";
import { submitInquiry } from "../api/client";

const process = [
  [MessageSquare, "Share brief", "Tell us the occasion, theme, flavour, and delivery city."],
  [Palette, "Design match", "Our team maps your idea to cake size, finish, and decoration."],
  [Calendar, "Confirm slot", "Choose a delivery date and approve the final quote."],
  [CheckCircle2, "Fresh bake", "Your custom cake is baked, packed, and delivered fresh."]
];

function CustomCake() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    submitInquiry({
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      eventDate: String(formData.get("eventDate") || ""),
      guestCount: String(formData.get("guestCount") || ""),
      theme: String(formData.get("theme") || "")
    }).catch(() => void 0);
    setSubmitted(true);
    toast.success("Custom cake request received");
  };

  if (submitted) {
    return (
      <div className="bk-page">
        <div className="bk-shell grid min-h-[calc(100vh-118px)] place-items-center py-10 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="bk-card max-w-lg p-8 md:p-10">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#fff2e9] text-[#e61951]">
              <CheckCircle2 size={42} />
            </div>
            <h1 className="mt-6 text-3xl font-black text-[#1f2221]">Request Sent</h1>
            <p className="mt-3 text-sm leading-7 text-[#6f7573]">
              Your custom cake inquiry is in. Our team will contact you with flavour options, design details, and delivery availability.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button type="button" onClick={() => setSubmitted(false)} className="bk-outline-btn h-11 px-5 text-sm">Submit Another</button>
              <Link to="/shop" className="bk-btn h-11 px-5 text-sm">Shop Ready Cakes</Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="bk-page">
      <section className="bk-shell py-5">
        <div className="relative min-h-[320px] overflow-hidden rounded-xl bg-[#1f2221] p-6 md:p-10">
          <img
            src="https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&q=80&w=1800"
            alt="Custom cake"
            className="absolute inset-0 h-full w-full object-cover opacity-65"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/25 to-transparent" />
          <div className="relative flex min-h-[280px] max-w-xl flex-col justify-center text-white">
            <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-black text-[#e61951]">
              <Sparkles size={14} />
              Customized Cakes
            </span>
            <h1 className="text-4xl font-black leading-tight md:text-6xl">Design your celebration cake</h1>
            <p className="mt-4 text-sm font-bold leading-7 text-white/88 md:text-base">
              Share a theme, reference image, guest count, and delivery date. We will prepare a fresh cake plan for the occasion.
            </p>
          </div>
        </div>
      </section>

      <section className="bk-shell grid gap-5 pb-10 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-5">
          <div className="bk-card p-5">
            <h2 className="mb-5 text-xl font-black text-[#1f2221]">How it works</h2>
            <div className="space-y-5">
              {process.map(([Icon, title, copy], index) => (
                <div key={title} className="flex gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#fff2e9] text-[#e61951]">
                    <Icon size={19} />
                  </span>
                  <div>
                    <p className="text-sm font-black text-[#1f2221]">{index + 1}. {title}</p>
                    <p className="mt-1 text-xs leading-5 text-[#6f7573]">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-[#fff2e9] p-5">
            <h3 className="text-base font-black text-[#1f2221]">Need a faster quote?</h3>
            <p className="mt-2 text-sm leading-6 text-[#6f7573]">For same-week designer cakes, call our cake desk between 10 AM and 8 PM.</p>
            <p className="mt-4 text-lg font-black text-[#e61951]">+91 98765 43210</p>
          </div>
        </aside>

        <main className="bk-card overflow-hidden">
          <div className="border-b border-[#ebebeb] bg-white p-5 md:p-7">
            <h2 className="text-2xl font-black text-[#1f2221]">Custom Cake Request</h2>
            <p className="mt-1 text-sm leading-6 text-[#6f7573]">Fill the details and we will respond with design and pricing.</p>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-5 p-5 md:p-7">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Full Name" name="name" placeholder="Ayush Sharma" required />
              <Field label="Email Address" name="email" type="email" placeholder="ayush@example.com" required />
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              <Field label="Event Date" name="eventDate" type="date" required />
              <label className="block">
                <span className="mb-2 block text-sm font-black text-[#1f2221]">Guest Count</span>
                <span className="relative block">
                  <select name="guestCount" className="bk-input h-12 appearance-none px-4 text-sm">
                    <option>10 - 25 guests</option>
                    <option>25 - 50 guests</option>
                    <option>50 - 100 guests</option>
                    <option>100+ guests</option>
                  </select>
                  <Users className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#9a9f9d]" size={17} />
                </span>
              </label>
              <Field label="Budget" name="budget" placeholder="Rs. 2500" />
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-black text-[#1f2221]">Occasion, Theme, and Flavour</span>
              <textarea
                name="theme"
                rows={5}
                placeholder="Tell us about the cake design, colour palette, flavour, name on cake, and delivery city."
                className="bk-input resize-none px-4 py-3 text-sm"
                required
              />
            </label>

            <button type="button" className="flex min-h-24 items-center justify-center gap-3 rounded-lg border border-dashed border-[#e61951]/40 bg-[#fff2e9] p-5 text-sm font-black text-[#e61951]">
              <Upload size={19} />
              Upload Reference Image
            </button>

            <div className="flex flex-col gap-3 border-t border-[#ebebeb] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-[#6f7573]">Custom cakes require design confirmation before baking.</p>
              <button type="submit" className="bk-btn h-12 px-6 text-sm">
                <Send size={17} />
                Submit Request
              </button>
            </div>
          </form>
        </main>
      </section>
    </div>
  );
}

function Field({ label, name, type = "text", placeholder, required = false }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-[#1f2221]">{label}</span>
      <input name={name} type={type} placeholder={placeholder} required={required} className="bk-input h-12 px-4 text-sm" />
    </label>
  );
}

export {
  CustomCake as default
};
