<script>
  import Router from "svelte-spa-router";
  import Home from "./pages/Home.svelte";
  import About from "./pages/About.svelte";

  const routes = {
    "/": Home,
    "/about": About,
  };
</script>

<div>
  <nav>
    <a href="#/">Home</a> |
    <a href="#/about">About</a>
  </nav>
  <Router {routes} />
</div>
