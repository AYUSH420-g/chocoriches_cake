import { Link } from "react-router";
import { motion } from "motion/react";
import { Camera, CheckCircle2, MessageCircle, Palette, Sparkles, Heart } from "lucide-react";

const process = [
  [MessageCircle, "Message on WhatsApp", "Reach out to us on WhatsApp to start your custom cake journey."],
  [Palette, "Share Theme & Details", "Send us your design ideas, brief topic, and the overall theme."],
  [Camera, "Send Reference Photo", "Share a reference photo and we can recreate it exactly for you!"],
  [CheckCircle2, "Fresh Bake & Delivery", "Your customized homemade cake is baked, packed, and delivered fresh."]
];

function CustomCake() {
  return (
    <div className="bk-page bg-gradient-to-b from-[#fdfbf9] to-white pb-16 overflow-hidden pt-8">
      <section className="bk-shell grid gap-8 lg:grid-cols-[400px_1fr] items-start">
        <aside className="space-y-6 lg:sticky lg:top-24">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl border border-[#ebebeb] bg-white p-8 shadow-xl shadow-black/5"
          >
            <h2 className="mb-8 flex items-center gap-3 text-2xl font-black text-[#1f2221]">
              <Sparkles className="text-[#e61951]" size={24} />
              How It Works
            </h2>
            <div className="space-y-8 relative before:absolute before:left-[22px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-[#e61951] before:to-transparent">
              {process.map(([Icon, title, copy], index) => (
                <motion.div 
                  key={title} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="group relative flex gap-6"
                >
                  <span className="relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white border-2 border-[#e61951] text-[#e61951] shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:bg-[#e61951] group-hover:text-white">
                    <Icon size={18} />
                  </span>
                  <div className="pt-1">
                    <p className="text-base font-black text-[#1f2221] group-hover:text-[#e61951] transition-colors">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-[#6f7573]">{copy}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </aside>

        <motion.main 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative overflow-hidden rounded-3xl border border-[#ebebeb] bg-white shadow-2xl shadow-[#e61951]/5"
        >
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#fff2e9] to-white" />
          
          <div className="relative z-10 p-8 md:p-12 flex flex-col items-center text-center">
            <span className="mb-6 grid h-20 w-20 place-items-center rounded-2xl bg-[#e61951] text-white shadow-xl shadow-[#e61951]/30 rotate-[-5deg] hover:rotate-0 transition-transform duration-300">
              <Heart size={36} fill="currentColor" />
            </span>
            
            <h2 className="text-3xl font-black text-[#1f2221] md:text-4xl max-w-md leading-tight">
              Order your <span className="text-[#e61951] relative inline-block">customize pure<svg className="absolute -bottom-2 left-0 w-full h-3 text-[#e61951]/30" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="transparent"/></svg></span> homemade cake
            </h2>
            
            <div className="mt-10 relative w-full max-w-lg group">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#e61951] to-[#ff8c00] opacity-20 blur transition group-hover:opacity-40 duration-500" />
              <img 
                src="https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&q=80&w=800" 
                alt="Beautiful customized cake" 
                loading="lazy"
                className="relative mx-auto h-[320px] w-full rounded-2xl object-cover shadow-md transition duration-500 group-hover:scale-[1.02]" 
              />
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-white">
                 <p className="text-xs font-black text-[#1f2221] flex items-center gap-2">
                   <CheckCircle2 size={14} className="text-[#0f8b57]" /> Pure Homemade
                 </p>
              </div>
            </div>

            <p className="mx-auto mt-8 max-w-md text-base leading-7 text-[#5f6663]">
              Send us your design ideas and we'll bring them to life exactly as you imagine! Perfect for birthdays, weddings, and grand celebrations.
            </p>

            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="https://wa.me/919429304484"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 flex h-16 w-full max-w-sm items-center justify-center gap-4 rounded-2xl bg-[#25d366] px-8 text-lg font-black text-white shadow-xl shadow-[#25d366]/30 transition-all hover:bg-[#20bd5a]"
            >
              <MessageCircle size={28} />
              Chat on WhatsApp
            </motion.a>
            <p className="mt-4 text-sm font-bold text-[#9a9f9d] tracking-wide">+91 94293 04484</p>
          </div>
        </motion.main>
      </section>
    </div>
  );
}

export {
  CustomCake as default
};
