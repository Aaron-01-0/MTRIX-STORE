import { useState, Suspense, lazy } from 'react';
import SEO from '@/components/SEO';
import MTRIXLogo from '@/components/MTRIXLogo';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroSection from '@/components/home/HeroSection';
import PromotionsStrip from '@/components/PromotionsStrip';

// Lazy load below-the-fold components
const CategoryGrid = lazy(() => import('@/components/home/CategoryGrid'));
const TrendingCollections = lazy(() => import('@/components/home/TrendingCollections'));
const ProductBentoGrid = lazy(() => import('@/components/home/ProductBentoGrid'));
const BrandStory = lazy(() => import('@/components/home/BrandStory'));
const VisualFeatures = lazy(() => import('@/components/home/VisualFeatures'));
const TrendingSlider = lazy(() => import('@/components/home/TrendingSlider'));
const SocialShowcase = lazy(() => import('@/components/home/SocialShowcase'));
const SetupBuilder = lazy(() => import('@/components/home/SetupBuilder'));

const LoadingFallback = () => (
  <div className="w-full h-48 flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const Index = () => {
  const [showMainContent, setShowMainContent] = useState(() => {
    return sessionStorage.getItem('hasVisited') === 'true';
  });

  if (!showMainContent) {
    return <MTRIXLogo onAnimationComplete={() => {
      setShowMainContent(true);
      sessionStorage.setItem('hasVisited', 'true');
    }} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Home"
        description="MTRIX - Premium Tech & Lifestyle Accessories. Elevate your setup with our curated collection."
      />
      <Navbar />
      <HeroSection />
      <PromotionsStrip />

      <Suspense fallback={<LoadingFallback />}>
        <CategoryGrid />
      </Suspense>

      <Suspense fallback={<LoadingFallback />}>
        <TrendingCollections />
      </Suspense>

      <Suspense fallback={<LoadingFallback />}>
        <ProductBentoGrid />
      </Suspense>

      <Suspense fallback={<LoadingFallback />}>
        <BrandStory />
      </Suspense>

      <Suspense fallback={<LoadingFallback />}>
        <VisualFeatures />
      </Suspense>

      <Suspense fallback={<LoadingFallback />}>
        <TrendingSlider />
      </Suspense>

      <Suspense fallback={<LoadingFallback />}>
        <SocialShowcase />
      </Suspense>

      <Suspense fallback={<LoadingFallback />}>
        <SetupBuilder />
      </Suspense>

      <Footer />
    </div>
  );
};

export default Index;
