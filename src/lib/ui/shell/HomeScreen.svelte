<script module lang="ts">
  /** Props for the intentionally empty Studio home surface. */
  export interface HomeScreenProps {
    title: string;
  }
</script>

<script lang="ts">
  let { title }: HomeScreenProps = $props();
</script>

<h1>{title}</h1>

<style>
  h1 {
    position: absolute;
    clip-path: inset(50%);
    margin: 0;
    border: 0;
    padding: 0;
    inline-size: var(--border-width-thin);
    block-size: var(--border-width-thin);
    overflow: hidden;
    white-space: nowrap;
  }
</style>
