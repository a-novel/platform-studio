<script module lang="ts">
  import HomeScreen from "./HomeScreen.svelte";

  import { defineMeta } from "@storybook/addon-svelte-csf";

  const { Story } = defineMeta({
    title: "Shell/Empty home",
    component: HomeScreen,
    tags: ["autodocs"],
    parameters: {
      layout: "fullscreen",
      docs: {
        description: {
          component:
            "The intentionally empty Studio workspace. Its title remains available to assistive technology while the canvas stays clear for future creative tools.",
        },
      },
    },
  });
</script>

<Story name="Default" />
