import { Injector, Type } from '@angular/core';
import { Application, Container } from 'pixi.js';

export interface GameManifest {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly thumbnail: string;
  readonly tags: readonly string[];
  readonly accent: string;
  readonly disabled?: boolean;
}

export interface GameContext {
  readonly app: Application;
  readonly stage: Container;
  readonly width: number;
  readonly height: number;
  readonly injector: Injector;
}

export interface GameRegistration {
  readonly manifest: GameManifest;
  readonly loadShell: () => Promise<Type<unknown>>;
}
