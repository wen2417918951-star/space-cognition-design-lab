# StPageFlip 2.0.7

Source: https://github.com/Nodlik/StPageFlip (MIT).
Bundle: https://registry.npmjs.org/page-flip/-/page-flip-2.0.7.tgz

Local changes, including lifecycle issues #71 and #66:

- The render loop has stop() and suspended flags, exits when its host is detached,
  and skips drawing while the document or reader is hidden. The site calls stop()
  before destroying an instance or changing the layout.
- showNext() never advances the spread index beyond the final spread.
- In portrait mode, release past the visible page midpoint completes a drag;
  a shorter drag returns to the current page, in either direction.
- The resize listener is removed on destruction even with mouse input disabled.

The original license is preserved. No runtime CDN or external service is used.
