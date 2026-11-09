'use strict';

// Register 16-band native audio buffer from Wallpaper Engine C++ engine
const audio = engine.registerAudioBuffers(engine.AUDIO_RESOLUTION_16);
let smoothBass = 0.0;

/**
 * Updates every frame on GPU/C++ thread without any Web/Chromium overhead!
 * Pulses the 3D Neural Core in rhythm with sub-bass kicks and bass drops.
 */
export function update(value) {
	if (!audio || !audio.average) {
		return value;
	}
	let rawBass = (audio.average[0] * 1.5 + audio.average[1] * 1.2 + audio.average[2] * 0.8) / 3.5;
	smoothBass += (rawBass - smoothBass) * 0.25;

	// Scale pulse: pristine 1.0 at rest, expands organically on beats
	let s = 1.0 + Math.min(0.20, smoothBass * 0.28);
	return new Vec3(s, s, 1.0);
}
