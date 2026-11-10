<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface TopProduct {
  name: string
  quantity: number
}

const props = defineProps<{ data: TopProduct[] }>()
const emit = defineEmits<{ navigate: [] }>()

const maxQuantity = computed(() => Math.max(...props.data.map(product => product.quantity), 0))

const progressWidth = (quantity: number) =>
  maxQuantity.value > 0 ? `${(quantity / maxQuantity.value) * 100}%` : '0%'
</script>

<template>
  <Card class="overflow-hidden rounded-2xl py-0 shadow-sm">
    <CardHeader class="flex flex-row items-center justify-between gap-4 p-5 pb-3">
      <CardTitle class="text-base">Produtos mais vendidos</CardTitle>
      <button
        type="button"
        class="shrink-0 text-xs font-medium text-primary hover:underline"
        @click="emit('navigate')"
      >
        Ver vendas →
      </button>
    </CardHeader>

    <CardContent class="px-5 pb-4">
      <div class="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
        <div
          v-for="(product, index) in data"
          :key="product.name"
          class="min-w-0"
        >
          <div class="mb-1 flex items-center justify-between gap-3">
            <p class="truncate text-xs font-medium">
              <span class="font-semibold">{{ index + 1 }}º</span>
              {{ product.name }}
            </p>
          </div>

          <p class="mb-1 text-lg font-bold leading-tight">{{ product.quantity }} un.</p>
          <div
            class="h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            :aria-label="`Vendas de ${product.name}`"
            :aria-valuenow="product.quantity"
            :aria-valuemin="0"
            :aria-valuemax="maxQuantity"
          >
            <div
              class="h-full rounded-full bg-primary transition-[width]"
              :style="{ width: progressWidth(product.quantity) }"
            />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
