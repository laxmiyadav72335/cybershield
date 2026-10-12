import Hero from '../components/home/Hero';
import ScannerCards from '../components/home/ScannerCards';
import HowItWorks from '../components/home/HowItWorks';
import VerdictLegend from '../components/home/VerdictLegend';

export default function Home() {
  return (
    <>
      <Hero />
      <VerdictLegend />
      <ScannerCards />
      <HowItWorks />
    </>
  );
}
