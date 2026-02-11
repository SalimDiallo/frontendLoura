import HeroVideoDialog from "../ui/hero-video-dialog";

export function HeroVideoSection() {
  // You could move these to a config or props for better reuse/flexibility
  const videoSrc = "https://www.youtube.com/embed/wZVtzOp92lc?si=pMgLxPB3xH5Od7r-&autoplay=1";
  const thumbnailSrc = "https://img.youtube.com/vi/wZVtzOp92lc/maxresdefault.jpg";
  const thumbnailAlt = "Présentation Loura - Plateforme tout-en-un";
  
  return (
    <section
      className="relative mx-auto flex w-full items-center justify-center pb-24"
      aria-label="Vidéo de présentation"
    >
      <div className="w-full flex items-center justify-center">
        <HeroVideoDialog
          animationStyle="from-center"
          videoSrc={videoSrc}
          thumbnailSrc={thumbnailSrc}
          thumbnailAlt={thumbnailAlt}
          className="border border-primary/10 rounded-2xl shadow-xl max-w-7xl w-full mt-20 transition-all duration-300 hover:shadow-2xl bg-muted/40"
        />
      </div>
    </section>
  );
}