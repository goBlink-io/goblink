/**
 * Frames layout — strips the main nav/footer for clean frame rendering.
 * If a user visits the frame URL directly, they see a minimal dark page.
 */
export default function FramesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
