import { motion } from "framer-motion";
import YouTube from "react-youtube";

/**
 * VideoPlayer Component
 * ---------------------
 * A responsive YouTube video player with fade-in animation.
 *
 * Features:
 * - Only renders when `videoKey` is provided
 * - Responsive container with aspect ratio (16:9)
 * - Full-width YouTube iframe inside a rounded black box
 * - Fade-in animation when mounted
 * - Safe handling of player events (ready, state change)
 *
 * Props:
 * - `videoKey` (string): YouTube video ID (e.g., "dQw4w9WgXcQ")
 */
const VideoPlayer = ({ videoKey }) => {
  if (!videoKey) return null;

  const opts = {
    width: "100%",
    height: "100%",
    playerVars: {
      autoplay: 0,
      controls: 1,
    },
  };

  const onReady = (event) => {
    console.log("YouTube player is ready", event.target);
  };

  const onStateChange = (event) => {
    console.log("YouTube player state changed:", event.data);
  };

  const youtubeLink = `https://www.youtube.com/watch?v=${videoKey}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full sm:max-w-90 md:max-w-3xl lg:max-w-5xl mx-auto mt-10"
    >
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <YouTube
          videoId={videoKey}
          className="absolute inset-0 w-full h-full"
          iframeClassName="w-full h-full"
          opts={opts}
          onReady={onReady}
          onStateChange={onStateChange}
          onError={() => {
            window.open(youtubeLink, "_blank");
          }}
        />
      </div>
      <p className="text-center text-gray-400 text-sm mt-2">
        If trailer doesn't load,{" "}
        <a
          href={youtubeLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline"
        >
          watch on YouTube
        </a>
      </p>
    </motion.div>
  );
};

export default VideoPlayer;
