export interface KeyboardActions {
  readonly onPress: () => void;
  readonly onPause: () => void;
  readonly onRetry: () => void;
  readonly onNext: () => void;
}

export class KeyboardInput {
  private readonly handler: (e: KeyboardEvent) => void;

  constructor(actions: KeyboardActions) {
    this.handler = (e: KeyboardEvent) => {
      if (this.shouldIgnore(e)) return;
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (!e.repeat) actions.onPress();
          break;
        case 'Escape':
        case 'KeyP':
          e.preventDefault();
          if (!e.repeat) actions.onPause();
          break;
        case 'KeyR':
          if (!e.repeat) actions.onRetry();
          break;
        case 'KeyN':
          if (!e.repeat) actions.onNext();
          break;
      }
    };
    window.addEventListener('keydown', this.handler);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.handler);
  }

  private shouldIgnore(e: KeyboardEvent): boolean {
    const target = e.target as HTMLElement | null;
    if (!target) return false;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return true;
    if (target.isContentEditable) return true;
    return false;
  }
}
