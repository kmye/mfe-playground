<script>
  import Router from "svelte-spa-router";
  import Home from "./pages/Home.svelte";
  import About from "./pages/About.svelte";

  let { user } = $props();

  const routes = {
    "/": Home,
    "/about": About,
  };
</script>

<div>
  <nav>
    <a href="#/">Home</a> |
    <a href="#/about">About</a>
    {#if user}
      <span style="float: right">{user.name} ({user.email})</span>
    {/if}
  </nav>
  <Router {routes} />
</div>
