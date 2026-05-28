<script setup lang="ts">
defineProps<{
  user?: { name: string; email: string };
}>();
</script>

<template>
  <div>
    <nav>
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link>
      <span v-if="user" style="float: right">{{ user.name }} ({{ user.email }})</span>
    </nav>
    <router-view />
  </div>
</template>
