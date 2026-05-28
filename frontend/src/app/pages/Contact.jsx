import { Clock, Mail, MessageCircle, Phone } from "lucide-react";

export default function Contact() {
  return (
    <div className="bk-page min-h-screen bg-[#f7f7f7] py-12 md:py-16">
      <div className="bk-shell max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-[#e61951] tracking-tight sm:text-4xl">
            Contact Us
          </h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2 max-w-3xl mx-auto">
          {/* Chat with us */}
          <a
            href="https://wa.me/919429304484"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-md bg-[#25D366] px-5 py-4 text-white shadow-sm transition hover:bg-[#20b858] hover:shadow-md"
          >
            <MessageCircle size={22} className="shrink-0" />
            <span className="text-base font-bold">Chat with us</span>
          </a>

          {/* Email */}
          <a
            href="mailto:chocoriches.help@gmail.com"
            className="flex items-center gap-3 rounded-md border border-[#ebebeb] bg-white px-5 py-4 shadow-sm transition hover:border-[#e61951] hover:shadow-md"
          >
            <Mail size={22} className="shrink-0 text-[#1f2221]" />
            <span className="text-base text-[#6f7573]">
              Email: <span className="font-bold text-[#1f2221] underline decoration-[#ebebeb] underline-offset-4 transition-colors hover:decoration-[#e61951]">chocoriches.help@gmail.com</span>
            </span>
          </a>

          {/* Support Hours */}
          <div className="flex items-center gap-3 rounded-md border border-[#ebebeb] bg-white px-5 py-4 shadow-sm">
            <span className="text-base text-[#6f7573]">
              Call & Email Support: <span className="font-bold text-[#1f2221]">10:00 AM - 10:00 PM</span>
            </span>
          </div>

          {/* Call us */}
          <a
            href="tel:+919429304484"
            className="flex items-center gap-3 rounded-md border border-[#ebebeb] bg-white px-5 py-4 shadow-sm transition hover:border-[#e61951] hover:shadow-md"
          >
            <Phone size={22} className="shrink-0 text-[#1f2221]" />
            <span className="text-base text-[#6f7573]">
              Call us: <span className="font-bold text-[#1f2221]">+91 9429304484</span>
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
