import { CakeSlice } from "lucide-react";

export default function About() {
  return (
    <div className="bk-page min-h-screen bg-[#f7f7f7] py-6 md:py-20">
      <div className="bk-shell max-w-4xl mx-auto">
        <div className="mb-6 text-center md:mb-12">
          <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-[#fff2e9] text-[#e61951] md:mb-4 md:h-16 md:w-16">
            <CakeSlice size={28} />
          </span>
          <h1 className="text-2xl font-black tracking-tight text-[#1f2221] sm:text-5xl">
            About ChocoRiches
          </h1>
        </div>

        <div className="space-y-6 rounded-lg border border-[#ebebeb] bg-white p-5 leading-relaxed text-[#1f2221] shadow-sm md:space-y-8 md:rounded-2xl md:p-12">
          <section className="space-y-4">
            <p>
              At ChocoRiches, every cake begins with a story of passion, love, and homemade happiness. What started as baking cakes for relatives and friends soon became something much bigger. With every celebration, birthday, and special occasion, our cakes received heartfelt appreciation, and through word-of-mouth references, we started receiving more and more orders — all with zero negative reviews till date.
            </p>
            <p>
              For the past 5 years, we have proudly served as home bakers, creating fresh and customized cakes from our home kitchen with the same care and quality we would serve to our own family. The love and trust we received inspired us to take the next step. In 2026, we decided to launch ChocoRiches to bring the same homemade taste, premium quality, and memorable experience to every Ahmedabadi.
            </p>
            <p>
              We believe every celebration deserves a cake that is fresh, delicious, and made with care. That’s why we start preparing every order only after receiving it. No pre-made cakes, no compromise in freshness. We use ingredients from rich and trusted brands to ensure every bite feels premium, soft, and full of flavor.
            </p>
            <p>
              From kids to grandparents, everyone can find a cake they love at ChocoRiches. Whether it’s a birthday, anniversary, surprise celebration, or custom-designed cake, we make every creation with pure taste and lots of love from our chef — our moms’ magical hands.
            </p>
          </section>

          <hr className="border-[#ebebeb]" />

          <section>
            <h2 className="mb-4 text-xl font-black text-[#1f2221] md:mb-6 md:text-2xl">Why Choose ChocoRiches?</h2>
            <ul className="grid gap-4 sm:grid-cols-2 text-sm">
              {[
                "100% fresh homemade cakes prepared after order confirmation",
                "Premium quality ingredients from trusted brands",
                "Customized cake designs for every occasion",
                "Soft, rich, and pure homemade taste",
                "Cakes made with love and care from experienced home bakers",
                "Zero compromise on hygiene and quality",
                "Limited orders per day to maintain perfection in every cake",
                "Careful packaging and delivery so your celebration stays special"
              ].map((point, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="mt-1 flex h-2 w-2 shrink-0 rounded-full bg-[#e61951]"></span>
                  <span className="font-bold text-[#6f7573]">{point}</span>
                </li>
              ))}
            </ul>
          </section>

          <hr className="border-[#ebebeb]" />

          <section className="text-center space-y-6">
            <p className="text-base font-medium text-[#6f7573] md:text-lg">
              At ChocoRiches, we don’t just bake cakes — we become a part of your happiest moments. Every cake is prepared with patience, creativity, and love so you can celebrate your occasion with sweetness, happiness, and unforgettable memories.
            </p>
            <div className="inline-block rounded-xl bg-[#fff2e9] px-6 py-4">
              <p className="text-base font-black italic text-[#e61951]">
                “Made at home, served with love, and crafted for your special moments.”
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
