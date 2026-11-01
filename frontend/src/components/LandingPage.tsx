import React, { useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { startLenis, stopLenis } from '../lib/lenis';
import { LandingNav } from './landing/LandingNav';
import { StageSection } from './landing/StageSection';
import { Manifesto, ProductSection } from './landing/ProductSections';
import { AssistantSection, ClosingCta, FaqSection, LandingFooter, SecuritySection } from './landing/ClosingSections';

export const LandingPage: React.FC<{ onOpenApp: () => void }> = ({ onOpenApp }) => {
  const { user, openAuthModal } = useAuth();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    startLenis();
    return () => stopLenis();
  }, [reduce]);

  const primary = () => (user ? onOpenApp() : openAuthModal());

  return (
    <div className="relative bg-night text-vellum grain">
      <LandingNav signedIn={!!user} onPrimary={primary} onSignIn={openAuthModal} />
      <main>
        <StageSection signedIn={!!user} onPrimary={primary} />
        <Manifesto />
        <ProductSection />
        <AssistantSection signedIn={!!user} onPrimary={primary} />
        <SecuritySection />
        <FaqSection />
        <ClosingCta signedIn={!!user} onPrimary={primary} />
      </main>
      <LandingFooter signedIn={!!user} onSignIn={openAuthModal} />
    </div>
  );
};
