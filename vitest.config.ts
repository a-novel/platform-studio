import { SvelteKitVitest } from "@a-novel-kit/nodelib-config/vitest-sveltekit";
import { Yaml } from "@a-novel-kit/nodelib-config/yaml";

export default SvelteKitVitest({
  rootUrl: import.meta.url,
  vitePlugins: () => [
    Yaml(),
    {
      name: "studio-validation-dependencies",
      config: () => ({ optimizeDeps: { include: ["@a-novel/service-authentication-rest", "zod"] } }),
    },
  ],
});
