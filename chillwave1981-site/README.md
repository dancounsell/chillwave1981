# Chillwave — Back to 1981

A portable, dependency-free atmospheric music player. Serve `dist/` with any static host, or run `npm start` and open http://localhost:4173.

The apartment scene fills the main view, with a compact player underneath. Click the station name to choose a preset, or open Sound to adjust music, rain, and city levels. Escape or a click outside closes either panel.

Press play to begin original browser-generated instrumental music. Three station presets change chord progressions, tempo, and synth timbre. Rain and distant city are synthesized separately with independent volume controls. These are generative stations, not external internet-radio streams or recorded tracks. The page must remain open; operating-system sleep can interrupt browser audio.

## Structure

- `dist/audio-engine.js`: framework-independent Web Audio synthesis; `play`, `pause`, `select`, `setLevel`, and `dispose` methods. Synth pads, bass, restrained percussion, sparse melody, room reverb, rain and low city rumble. Chord and melody patterns evolve; musical material repeats.
- `dist/app.js`: player state, native media controls, clock and pixel scene renderer.
- `dist/style.css`: responsive accessible controls, muted palette, reduced-motion support.
- `dist/assets/apartment.png`: original generated pixel artwork, rendered to a 640 × 360 canvas without smoothing.

Music starts only after a user gesture. Pause suspends the entire audio context, including ambience. A 90-second scheduling horizon accommodates ordinary background-tab timer throttling. Volume changes and station changes are faded. Scene animation can be paused independently and honors the OS reduced-motion preference. Space toggles playback when not focused on a control.

A future native wrapper can reuse the static interface and audio engine in a WebView. The audio engine has no backend or framework dependency. A native audio host would be needed for guaranteed playback during device sleep or aggressive browser suspension.

Run `npm run check` for JavaScript syntax validation. Hosting identity is in `.openai/hosting.json`.
