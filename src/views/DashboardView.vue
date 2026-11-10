<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Plus, ArrowLeftRight, Package, Boxes, TriangleAlert, Wallet } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import StatCard from '@/components/dashboard/StatCard.vue'
import MovementsChart from '@/components/dashboard/MovementsChart.vue'
import type { MovementPoint } from '@/components/dashboard/MovementsChart.vue'
import TopProducts from '@/components/dashboard/TopProducts.vue'
import type { TopProduct } from '@/components/dashboard/TopProducts.vue'
import RecentMovements from '@/components/dashboard/RecentMovements.vue'
import type { RecentMovement } from '@/components/dashboard/RecentMovements.vue'
import LowStockProducts from '@/components/dashboard/LowStockProducts.vue'
import type { LowStockProduct } from '@/components/dashboard/LowStockProducts.vue'
import { inventoryError, products, stockMovements } from '@/lib/inventory'
import { getDashboardSummaryFromApi, getMovementSummaryFromApi, getTopProductsFromApi } from '@/services/estoqueApi'

const brl = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatMovementDate = (value: string | Date) => {
  const datePart = String(value).slice(0, 10)
  const [year, month, day] = datePart.split('-')
  if (year && month && day && /^\d{4}-\d{2}-\d{2}$/.test(datePart))
    return `${day}/${month}`

  const date = value instanceof Date ? value : new Date(value)
  if (!Number.isNaN(date.getTime()))
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

  return datePart
}

const emit = defineEmits<{
  'create-product': []
  'create-movement': []
  'open-sales': []
  'open-products': []
  'open-movements': []
}>()

const dashboardSummary = ref({
  quantidade_produtos: 0,
  produtos_ativos: 0,
  unidades_em_estoque: 0,
  produtos_estoque_baixo: 0,
  valor_estimado_estoque: 0,
})

const movimentos = ref<MovementPoint[]>([])
const produtosMaisVendidos = ref<TopProduct[]>([])
const dashboardError = ref('')

const movimentacoesRecentes = computed<RecentMovement[]>(() =>
  stockMovements.value.slice(0, 6).map(movement => ({
    product: movement.product.name,
    person: 'Estoque',
    date: `${movement.date} · ${movement.time}`,
    quantity: movement.quantity,
    type: movement.type,
  })),
)

const produtosEstoqueBaixo = computed<LowStockProduct[]>(() =>
  products.value
    .filter(product => product.stock <= product.minimum)
    .map(product => ({
      name: product.name,
      available: product.stock,
      minimum: product.minimum,
    }))
    .slice(0, 5),
)

const stats = computed(() => [
  { title: 'Produtos cadastrados', value: dashboardSummary.value.quantidade_produtos, description: 'Produtos cadastrados', icon: Package },
  { title: 'Unidades em estoque', value: dashboardSummary.value.unidades_em_estoque, description: 'Soma dos saldos atuais', icon: Boxes },
  { title: 'Produtos com estoque baixo', value: dashboardSummary.value.produtos_estoque_baixo, description: 'No limite mínimo ou sem estoque', icon: TriangleAlert },
  { title: 'Valor estimado do estoque', value: brl(dashboardSummary.value.valor_estimado_estoque), description: 'Preço unitário × saldo atual', icon: Wallet },
])

const loadDashboard = async () => {
  dashboardError.value = ''
  try {
    const [summary, topProducts, movementSummary] = await Promise.all([
      getDashboardSummaryFromApi(),
      getTopProductsFromApi(),
      getMovementSummaryFromApi(),
    ])

    dashboardSummary.value = summary

    produtosMaisVendidos.value = topProducts.map(product => ({
      name: product.nome_produto,
      quantity: Number(product.quantidade_vendida),
    }))

    movimentos.value = movementSummary.movimentacoes_por_dia.map(day => ({
      label: formatMovementDate(day.data),
      entradas: Number(day.entradas ?? 0),
      saidas: Number(day.saidas ?? 0),
    }))
  }
  catch (error) {
    dashboardError.value = error instanceof Error ? error.message : 'Não foi possível carregar o painel.'
  }
}

onMounted(() => {
  loadDashboard()
})
</script>

<template>
  <section class="flex flex-col gap-6">
    <p v-if="inventoryError || dashboardError" role="alert" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
      {{ inventoryError || dashboardError }}
    </p>
    <div class="flex items-end justify-between">
      <div>
        <p class="text-[11px] font-semibold tracking-widest text-muted-foreground mb-5">ÁREA DE TRABALHO</p>
        <h1 class="text-4xl font-bold tracking-tight mb-2">Visão geral</h1>
        <p class="mt-1 text-sm text-muted-foreground">Olá, Vinicius! Aqui está o resumo do seu estoque hoje.</p>
      </div>

      <div class="flex gap-2">
        <Button variant="outline" @click="emit('create-product')"><Plus class="size-4" /> Cadastrar produto</Button>
        <Button @click="emit('create-movement')"><ArrowLeftRight class="size-4" /> Registrar movimentação</Button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard v-for="stat in stats" :key="stat.title" v-bind="stat" />
    </div>
    <MovementsChart :data="movimentos" />
    <TopProducts :data="produtosMaisVendidos" @navigate="emit('open-sales')" />
    <div class="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
      <RecentMovements :data="movimentacoesRecentes" @navigate="emit('open-movements')" />
      <LowStockProducts :data="produtosEstoqueBaixo" @navigate="emit('open-products')" />
    </div>
  </section>
</template>