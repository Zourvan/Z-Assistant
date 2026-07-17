/**
 * Nano Corgi — CSS-only corgi (adapted from CodePen OZZyxp by SlicedBreadAnimation).
 * Sits/stands/jumps in place; we use only the walking/standing variant for the overlay.
 */
export const NANO_CORGI_HTML = `
  <div class="nano-corgi">
    <div class="nano-dog-head-container nano-look-right nano-dog-head-standing-up">
      <div class="nano-dog-left-ear nano-dog-left-ear-standing"></div>
      <div class="nano-dog-head-2"></div>
      <div class="nano-dog-head">
        <div class="nano-dog-nose"></div>
      </div>
      <div class="nano-dog-head-spot nano-dog-head-spot-standing">
        <div class="nano-dog-eye"></div>
      </div>
      <div class="nano-dog-right-ear nano-dog-right-ear-standing"></div>
    </div>
    <div class="nano-collar nano-collar-standing-up">
      <div class="nano-collar-shade"></div>
    </div>
    <div class="nano-dog-torso nano-dog-torso-standing-up">
      <div class="nano-right-leg-standing"></div>
      <div class="nano-right-hind-standing"></div>
      <div class="nano-left-leg-standing"></div>
      <div class="nano-left-hind-standing"></div>
      <div class="nano-left-dog-foot nano-left-dog-foot-standing"></div>
      <div class="nano-dog-torso-chest nano-dog-chesting-standing-up">
        <div class="nano-swipes nano-swipe-chest">
          <div class="nano-swipe-1 nano-grey-swipe"></div>
          <div class="nano-swipe-2 nano-grey-swipe"></div>
        </div>
      </div>
      <div class="nano-dog-torso-light-standing"></div>
      <div class="nano-right-dog-foot nano-right-dog-foot-standing"></div>
    </div>
    <div class="nano-doggy-cushion nano-doggy-cushion-standing"></div>
    <div class="nano-tail-wrap">
      <div class="nano-nano-tail"></div>
    </div>
  </div>
`.trim();

export const NANO_CORGI_WIDTH = 52;
export const NANO_CORGI_HEIGHT = 40;
