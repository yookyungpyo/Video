import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);
// WebGL: "angle" works on desktop GPUs (Windows/macOS). On headless Linux
// without a GPU, pass --gl=swangle (SwiftShader) — see `npm run render:cpu`.
Config.setChromiumOpenGlRenderer("angle");
Config.setConcurrency(2);
