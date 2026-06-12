import { HeroSection } from '@/components/landing/HeroSection';
import { StatsSection } from '@/components/landing/StatsSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { FearSection } from '@/components/landing/FearSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { TrustSection } from '@/components/landing/TrustSection';

export function LandingPage() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <HowItWorksSection />
      <FearSection />
      <TestimonialsSection />
      <PricingSection />
      <TrustSection />
    </>
  );
}
