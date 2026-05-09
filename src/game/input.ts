export class InputBuffer {
  jumpQueued = false;
  jumpHeld = false;

  constructor(private canvas: HTMLCanvasElement) {
    window.addEventListener("keydown", this.onKeyDown, { passive: false });
    window.addEventListener("keyup", this.onKeyUp);
    canvas.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointerup", this.onPointerUp);
  }

  dispose(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointerup", this.onPointerUp);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.code === "Space" || e.key === " " || e.key === "ArrowUp") {
      e.preventDefault();
      this.jumpQueued = true;
      this.jumpHeld = true;
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    if (e.code === "Space" || e.key === " " || e.key === "ArrowUp") {
      this.jumpHeld = false;
    }
  };

  private onPointerDown = (): void => {
    this.jumpQueued = true;
    this.jumpHeld = true;
  };

  private onPointerUp = (): void => {
    this.jumpHeld = false;
  };

  /** Consume one buffered jump (call once per fixed tick if applying jump). */
  consumeJump(): boolean {
    if (this.jumpQueued) {
      this.jumpQueued = false;
      return true;
    }
    return false;
  }
}
