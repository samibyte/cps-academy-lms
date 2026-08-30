import { FaqSection } from "../_components/FaqSection";
import { Section, SectionHeader } from "../_components/Section";
import { Reveal } from "../_components/motion/Reveal";

function About() {
  return (
    <main className="flex flex-1 flex-col">
      <Section>
        <Reveal>
          <SectionHeader
            eyebrow="// about_us"
            title="আমাদের সম্পর্কে"
            description="কোডিং প্র্যাকটিস প্ল্যাটফর্ম যেখানে শিক্ষার্থীরা স্টেপ অ্যাপ দিয়ে এনরোল করে, কুইজ দিয়ে শেখে আর প্রতিদিন অনুশীলন চালায়।"
          />
        </Reveal>
      </Section>
      <FaqSection />
    </main>
  );
}

export default About;