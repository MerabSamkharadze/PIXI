export type LayoutMode = 'mobile' | 'desktop';

// iPhone SE is 375px wide; anything narrower than the desktop breakpoint
// uses the compact layout so games fit without horizontal scroll.
export const MOBILE_BREAKPOINT = 768;

export function getLayoutMode(viewportWidth: number): LayoutMode {
  return viewportWidth < MOBILE_BREAKPOINT ? 'mobile' : 'desktop';
}
