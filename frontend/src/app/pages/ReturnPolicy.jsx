import { PackageX } from "lucide-react";

export default function ReturnPolicy() {
  return (
    <div className="bk-page min-h-screen bg-[#f7f7f7] py-6 md:py-16">
      <div className="bk-shell max-w-4xl mx-auto">
        <div className="mb-6 text-center md:mb-10">
          <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-[#fff2e9] text-[#e63946] md:mb-4 md:h-14 md:w-14">
            <PackageX size={28} />
          </span>
          <h1 className="text-2xl font-black tracking-tight text-[#e63946] sm:text-4xl">
            Return Policy
          </h1>
        </div>

        <div className="space-y-5 rounded-lg border border-[#ebebeb] bg-white p-5 text-[#1f2221] shadow-sm md:space-y-6 md:rounded-2xl md:p-12">
          <div className="rounded-lg bg-[#fff2e9] p-4 md:rounded-xl md:p-5">
            <h2 className="text-lg font-black text-[#e63946] mb-2">No Return After Payment</h2>
            <p className="text-sm leading-7 text-[#6f7573]">
              At ChocoRiches, all cakes are freshly prepared only after receiving your order. Due to the perishable nature of our products, we do not accept any returns once the payment has been completed.
            </p>
          </div>

          <section>
            <h2 className="text-lg font-black text-[#1f2221] mb-3">Why No Returns?</h2>
            <ul className="space-y-3 text-sm text-[#6f7573]">
              {[
                "Every cake is made fresh after your order — no pre-made stock.",
                "Cakes are perishable items and cannot be resold or reused.",
                "We use premium quality ingredients prepared with utmost care and hygiene.",
                "Our team starts working on your cake immediately after order confirmation."
              ].map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-1.5 flex h-2 w-2 shrink-0 rounded-full bg-[#e63946]"></span>
                  <span className="font-bold">{point}</span>
                </li>
              ))}
            </ul>
          </section>

          <hr className="border-[#ebebeb]" />

          <section>
            <h2 className="text-lg font-black text-[#1f2221] mb-3">Damaged or Wrong Cake?</h2>
            <p className="text-sm leading-7 text-[#6f7573]">
              In the rare case that you receive a damaged or incorrect product, please contact us immediately via WhatsApp or email with photos within 30 minutes of delivery. We will review the situation and take appropriate action at our sole discretion.
            </p>
          </section>

          <div className="rounded-lg border border-[#ebebeb] bg-[#f7f7f7] p-4 text-center md:rounded-xl md:p-5">
            <p className="text-sm font-bold text-[#6f7573]">
              By placing an order, you agree to our return and refund policy as stated above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
