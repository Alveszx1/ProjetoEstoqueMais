<script setup lang="ts">
import type { Component } from 'vue'
import { Card, CardContent } from '@/components/ui/card'

defineProps<{
  title: string
  value: string | number
  description: string
  icon: Component
}>()
</script>

<template>
  <Card class="rounded-2xl py-0 shadow-sm">
    <CardContent class="flex flex-col gap-4 p-5">
      <div class="flex items-start justify-between gap-2">
        <p class="text-sm text-muted-foreground">{{ title }}</p>

        <div class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-primary">
          <component :is="icon" class="size-4" />
        </div>
      </div>

      <div>
        <p class="text-3xl font-bold tracking-tight">{{ value }}</p>
        <p class="mt-1 text-xs text-muted-foreground">{{ description }}</p>
      </div>
    </CardContent>
  </Card>
</template>