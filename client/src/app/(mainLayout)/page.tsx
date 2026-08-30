import { CtaBanner } from "./_components/CtaBanner";
import { FaqSection } from "./_components/FaqSection";
import { FeaturedCourses } from "./_components/FeaturedCourses";
import { Hero } from "./_components/Hero";
import { HowItWorks } from "./_components/HowItWorks";
import { StatsBar } from "./_components/StatsBar";

function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <StatsBar />
      <FeaturedCourses />
      <HowItWorks />
      <FaqSection />
      <CtaBanner />
    </main>
  );
}

export default Home;