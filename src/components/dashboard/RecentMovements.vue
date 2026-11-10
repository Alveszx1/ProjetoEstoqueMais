<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface RecentMovement {
  product: string
  person: string
  date: string
  quantity: number
  type: 'Entrada' | 'Saída'
}

defineProps<{ data: RecentMovement[] }>()
const emit = defineEmits<{ navigate: [] }>()
</script>

<template>
  <Card class="overflow-hidden rounded-2xl py-0 shadow-sm">
    <CardHeader class="flex flex-row items-center justify-between gap-4 border-b px-5 py-4">
      <CardTitle class="text-sm font-semibold">Movimentações recentes</CardTitle>
      <button
        type="button"
        class="shrink-0 text-xs font-medium text-primary hover:underline"
        @click="emit('navigate')"
      >
        Ver todas
      </button>
    </CardHeader>

    <CardContent class="p-0">
      <div
        v-for="(movement, index) in data"
        :key="`${movement.product}-${movement.date}-${index}`"
        class="flex min-w-0 items-center justify-between gap-3 border-b px-5 py-3 last:border-b-0"
      >
        <div class="min-w-0">
          <p class="truncate text-sm font-medium">{{ movement.product }}</p>
          <p class="mt-0.5 truncate text-xs text-muted-foreground">
            {{ movement.person }} · {{ movement.date }}
          </p>
        </div>

        <span
          class="shrink-0 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700"
        >
          {{ movement.type === 'Saída' ? '−' : '+' }} {{ movement.quantity }} un. · {{ movement.type }}
        </span>
      </div>
    </CardContent>
  </Card>
</template>
