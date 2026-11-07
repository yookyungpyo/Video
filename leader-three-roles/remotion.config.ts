import { Config } from "@remotion/cli/config";

// Output defaults for `npm run render` (1080x1920 comes from the composition).
Config.setVideoImageFormat("png"); // PNG frames -> standard yuv420p (limited range) output
Config.setCodec("h264");
Config.setCrf(16);
Config.setPixelFormat("yuv420p");
Config.setOverwriteOutput(true);

// Optional: use an already-installed Chrome instead of Remotion's download
// (set REMOTION_BROWSER_EXECUTABLE to its path). Leave unset on a normal Windows PC.
if (process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
}
