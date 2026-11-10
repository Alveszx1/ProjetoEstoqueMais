<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import AppSidebar from '@/components/layout/AppSideBar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import DashboardView from '@/views/DashboardView.vue'
import ProductsView from '@/views/ProductsView.vue'
import MovementsView from '@/views/MovementsView.vue'
import SalesView from '@/views/SalesView.vue'
import { products } from '@/lib/inventory'

const activeSection = ref('Visão geral')
const createProductRequest = ref(0)
const createMovementRequest = ref(0)
const requestProductCreation = async () => {
  activeSection.value = 'Produtos'
  await nextTick()
  createProductRequest.value++
}
const requestMovementCreation = async () => {
  activeSection.value = 'Movimentações'
  await nextTick()
  createMovementRequest.value++
}
const lowStockProducts = computed(() => products.value
  .filter(product => !product.inactive && product.stock <= product.minimum)
  .map(product => ({
    name: product.name,
    available: product.stock,
    minimum: product.minimum,
  })))
</script>

<template>
  <div class="flex min-h-screen bg-muted/40">
    <AppSidebar :active-item="activeSection" @select="activeSection = $event" />

    <main class="flex min-w-0 flex-1 flex-col gap-8 p-8">
      <AppHeader
        user-name="Equipe Estoque+"
        user-role="Gestão que movimenta"
        :notifications="lowStockProducts.length"
        :low-stock-products="lowStockProducts"
        @navigate="activeSection = $event"
      />
      <ProductsView
        v-if="activeSection === 'Produtos'"
        :open-create-request="createProductRequest"
      />
      <MovementsView
        v-else-if="activeSection === 'Movimentações'"
        :open-create-request="createMovementRequest"
      />
      <SalesView v-else-if="activeSection === 'Vendas do mês'" />
      <DashboardView
        v-else
        @create-product="requestProductCreation"
        @create-movement="requestMovementCreation"
        @open-sales="activeSection = 'Vendas do mês'"
        @open-products="activeSection = 'Produtos'"
        @open-movements="activeSection = 'Movimentações'"
      />
    </main>
  </div>
</template>