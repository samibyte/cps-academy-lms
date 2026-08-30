"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { Reveal } from "./motion/Reveal";
import { Section, SectionHeader } from "./Section";

const FAQS = [
  {
    value: "enrollment",
    question: "কোর্সে এনরোল করব কীভাবে?",
    answer:
      "প্রথমে একটা একাউন্ট তৈরি করে নাও। তারপর পছন্দের কোর্সে গিয়ে 'কোর্সটি দেখুন' বাটনে ক্লিক করে এনরোল করো। ফ্রি কোর্সে ডাইরেক্ট ঢুকতে পারবে, আর পেইড কোর্সে ফি জমা দেওয়ার পর সব লেসন আনলক হয়ে যাবে।",
  },
  {
    value: "pricing",
    question: "কোর্সের ফি কীভাবে নির্ধারিত হয়?",
    answer:
      "প্রতিটি কোর্সের পেজেই ফি স্পষ্ট লেখা থাকে। কিছু কোর্স সম্পূর্ণ ফ্রি, আর পেইড কোর্সগুলোর দাম কনটেন্টের গভীরতা অনুযায়ী ঠিক করা হয়েছে। কোনো লুকানো চার্জ নেই — যা দেখবে, তাই দেবে।",
  },
  {
    value: "certificate",
    question: "কোর্স শেষ করলে কি সার্টিফিকেট পাবো?",
    answer:
      "হ্যাঁ। কোনো কোর্সের সব লেসন শেষ করে কুইজগুলোতে পাস করলেই সার্টিফিকেট পাবে। ড্যাশবোর্ডের রিপোর্টকার্ড থেকে সেটা সবসময় দেখা ও ডাউনলোড করা যায়।",
  },
  {
    value: "progress",
    question: "আমার অগ্রগতি কোথায় দেখবো?",
    answer:
      "তোমার পুরো অগ্রগতির হিসাব রাখা হয় ড্যাশবোর্ডে। কোন লেসন শেষ করেছ, কোন কুইজে পাস বা ফেল — সব এক জায়গায় সাজানো থাকে, ঠিক একটা রিপোর্টকার্ডের মতো।",
  },
  {
    value: "quiz",
    question: "কুইজে পাস না করলে কী হবে?",
    answer:
      "চিন্তা নেই — কুইজে ফেল করলে যতবার ইচ্ছা আবার চেষ্টা করতে পারবে। ভুল উত্তরগুলো পর্যালোচনা করে সঠিক সমাধানটা বুঝে নাও, তারপর আবার চেষ্টা করো। শেখাটাই মূল লক্ষ্য।",
  },
];

export function FaqSection() {
  return (
    <Section>
      <Reveal>
        <SectionHeader
          eyebrow="// faq"
          title="সচরাচর জিজ্ঞাসা"
          description="কোনো প্রশ্ন থাকলে এখানে খুঁজে নাও — না পেলে আমাদের সহায়তা টিম তোমাকে সাহায্য করবে।"
        />
      </Reveal>

      <Reveal delay={0.08}>
        <Accordion
          defaultValue={[FAQS[0].value]}
          className="mx-auto mt-10 rounded-2xl border border-border/60 bg-card px-5 py-1.5"
        >
          {FAQS.map((faq) => (
            <AccordionItem key={faq.value} value={faq.value}>
              <AccordionTrigger className="text-base font-semibold">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </Section>
  );
}