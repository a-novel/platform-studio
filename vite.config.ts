import { SvelteKitVite } from "@a-novel-kit/nodelib-config/sveltekit";
import { Yaml } from "@a-novel-kit/nodelib-config/yaml";

export default SvelteKitVite({
  optimizeDeps: {
    include: ["@a-novel-kit/uikit", "@lucide/svelte"],
  },
  plugins: [Yaml()],
});
