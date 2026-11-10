<script setup lang="ts">
import { LayoutGrid, Package, ArrowLeftRight, Receipt } from 'lucide-vue-next'

const mainMenu = [
  { label: 'Visão geral', icon: LayoutGrid },
  { label: 'Produtos', icon: Package },
  { label: 'Movimentações', icon: ArrowLeftRight },
  { label: 'Vendas do mês', icon: Receipt },
]

defineProps<{ activeItem: string }>()
const emit = defineEmits<{ select: [item: string] }>()
</script>

<template>
  <aside class="sticky top-0 flex h-screen w-64 shrink-0 flex-col gap-6 border-r bg-white p-3">
    <div class="flex items-center gap-3 px-2 py-2">
      <img src="/logo.png" alt="Logo Estoque+" class="size-10 rounded-xl object-cover">
      <div class="leading-tight">
        <p class="font-semibold">Estoque+</p>
        <p class="text-[10px] font-medium tracking-widest text-muted-foreground">GESTÃO SIMPLES</p>
      </div>
    </div>

    <nav class="flex flex-col gap-1">
      <p class="px-2 pb-1 text-[10px] font-semibold tracking-widest text-muted-foreground">MENU PRINCIPAL</p>
      <button
        v-for="item in mainMenu"
        :key="item.label"
        class="flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left text-sm font-medium transition-colors"
        :class="activeItem === item.label ? 'border-sidebar-ring bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-muted'"
        @click="emit('select', item.label)"
      >
        <component :is="item.icon" class="size-4 shrink-0" />
        {{ item.label }}
      </button>
    </nav>

  </aside>
</template>