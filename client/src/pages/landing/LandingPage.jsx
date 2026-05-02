import { FaqSection } from '../../components/landing/FaqSection'
import { FeatureSection } from '../../components/landing/FeatureSection'
import { HeroSection } from '../../components/landing/HeroSection'
import { HowItWorksSection } from '../../components/landing/HowItWorksSection'
import { LandingFooter } from '../../components/landing/LandingFooter'
import { LandingHeader } from '../../components/landing/LandingHeader'
import { PricingCtaSection } from '../../components/landing/PricingCtaSection'
import { ProductPreviewSection } from '../../components/landing/ProductPreviewSection'
import { TemplatesSection } from '../../components/landing/TemplatesSection'
import { TestimonialsSection } from '../../components/landing/TestimonialsSection'
import { TrustSection } from '../../components/landing/TrustSection'

export function LandingPage({ theme, onThemeToggle }) {
  return (
    <div className="min-h-screen bg-white text-slate-950 dark:bg-slate-950 dark:text-white">
      <LandingHeader theme={theme} onThemeToggle={onThemeToggle} />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <FeatureSection />
        <ProductPreviewSection />
        <TemplatesSection />
        <TrustSection />
        <TestimonialsSection />
        <PricingCtaSection />
        <FaqSection />
      </main>
      <LandingFooter />
    </div>
  )
}
