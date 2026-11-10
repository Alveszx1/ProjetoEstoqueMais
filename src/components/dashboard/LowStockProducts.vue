<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface LowStockProduct {
  name: string
  available: number
  minimum: number
}

defineProps<{ data: LowStockProduct[] }>()
const emit = defineEmits<{ navigate: [] }>()
</script>

<template>
  <Card class="overflow-hidden rounded-2xl py-0 shadow-sm">
    <CardHeader class="flex flex-row items-center justify-between gap-4 border-b px-5 py-4">
      <CardTitle class="text-sm font-semibold">Produtos com estoque baixo</CardTitle>
      <button
        type="button"
        class="shrink-0 text-xs font-medium text-primary hover:underline"
        @click="emit('navigate')"
      >
        Ver produtos
      </button>
    </CardHeader>

    <CardContent class="p-0">
      <div
        v-for="product in data"
        :key="product.name"
        class="flex min-w-0 items-center justify-between gap-3 border-b px-5 py-3 last:border-b-0"
      >
        <div class="min-w-0">
          <p class="truncate text-sm font-medium">{{ product.name }}</p>
          <p class="mt-0.5 text-xs text-muted-foreground">
            {{ product.available }} un. disponível · mínimo {{ product.minimum }} un.
          </p>
        </div>

        <span
          class="shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium"
          :class="product.available === 0
            ? 'border-red-200 bg-red-50 text-red-700'
            : 'border-amber-200 bg-amber-50 text-amber-700'"
        >
          {{ product.available === 0 ? 'Sem estoque' : 'Estoque baixo' }}
        </span>
      </div>
    </CardContent>
  </Card>
</template>
