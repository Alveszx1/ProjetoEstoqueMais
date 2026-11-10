<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Check, ChevronDown, Download, FileText, Plus, Receipt, Trash2, X } from 'lucide-vue-next'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from 'reka-ui'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { inventoryError, products, recordSale, sales } from '@/lib/inventory'
import type { Product, SaleRecord } from '@/lib/inventory'
import {
  getSaleFromApi,
  getSalesFromApi,
  getSalesReportFromApi,
} from '@/services/estoqueApi'
import type { ApiSale, SalesReport } from '@/services/estoqueApi'

interface SaleDraftLine {
  productId: string
  quantity: number | ''
  unitPrice: number | ''
}

const now = new Date()
const localMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
const selectedMonth = ref(localMonthKey(now))
const isSaleDialogOpen = ref(false)
const saleDetails = ref<SaleRecord | null>(null)
const draftLines = ref<SaleDraftLine[]>([])
const saleError = ref('')
const salesReport = ref<SalesReport | null>(null)
const isLoadingSales = ref(false)

const monthOptions = computed(() => Array.from({ length: 18 }, (_, index) => {
  const date = new Date(now.getFullYear(), now.getMonth() - index, 1)
  return {
    value: localMonthKey(date),
    label: date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
  }
}))

const selectedMonthLabel = computed(() =>
  monthOptions.value.find(month => month.value === selectedMonth.value)?.label
  ?? new Date(`${selectedMonth.value}-01T12:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
)

const monthlySales = computed(() =>
  sales.value.filter(sale => sale.date.startsWith(selectedMonth.value)),
)

const activeProducts = computed(() => products.value.filter(product => !product.inactive))

const monthlyRevenue = computed(() =>
  Number(salesReport.value?.faturamento ?? 0),
)

const productSummary = computed(() => {
  return (salesReport.value?.produtos ?? []).map((item) => {
    const product = products.value.find(candidate => candidate.id === Number(item.id_produto)) ?? {
      id: Number(item.id_produto),
      name: item.produto,
      description: '',
      category: 'Geral',
      price: 0,
      stock: 0,
      minimum: 0,
      unit: 'un.',
    }
    return {
      product,
      quantity: Number(item.quantidade),
      revenue: Number(item.total_vendido),
    }
  })
})

const soldItemCount = computed(() => Number(salesReport.value?.itens_vendidos ?? 0))

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatQuantity = (value: number) =>
  value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })

const formatSaleDate = (sale: SaleRecord) => {
  const [year, month, day] = sale.date.split('-')
  return `${day}/${month}/${year} · ${sale.time}`
}

const normalizeApiSale = (sale: ApiSale): SaleRecord => {
  const dateTime = sale.data_venda
  const date = dateTime.slice(0, 10)
  const time = dateTime.slice(11, 16)

  return {
    id: Number(sale.id),
    date,
    time,
    items: sale.itens.map(item => ({
      product: products.value.find(product => product.id === Number(item.id_produto)) ?? {
        id: Number(item.id_produto),
        name: item.nome_produto,
        description: '',
        category: 'Geral',
        price: Number(item.preco_unitario),
        stock: 0,
        minimum: 0,
        unit: 'un.',
      },
      quantity: Number(item.quantidade),
      unitPrice: Number(item.preco_unitario),
    })),
  }
}

let loadSequence = 0
const loadMonthlySales = async () => {
  const sequence = ++loadSequence
  const [yearText, monthText] = selectedMonth.value.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  const start = `${selectedMonth.value}-01`
  const end = `${year}-${String(month).padStart(2, '0')}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`
  isLoadingSales.value = true
  saleError.value = ''

  try {
    const [report, summaries] = await Promise.all([
      getSalesReportFromApi(start, end),
      getSalesFromApi(start, end),
    ])
    const details = await Promise.all(summaries.map(async summary =>
      normalizeApiSale(await getSaleFromApi(Number(summary.id))),
    ))
    if (sequence !== loadSequence)
      return
    salesReport.value = report
    sales.value = details
  }
  catch (error) {
    if (sequence === loadSequence)
      saleError.value = error instanceof Error ? error.message : 'Não foi possível carregar as vendas.'
  }
  finally {
    if (sequence === loadSequence)
      isLoadingSales.value = false
  }
}

watch(selectedMonth, loadMonthlySales, { immediate: true })
const saleTotal = (sale: SaleRecord) =>
  sale.items.reduce((total, item) => total + item.quantity * item.unitPrice, 0)

const addSaleLine = () => {
  draftLines.value.push({ productId: '', quantity: '', unitPrice: '' })
}

const updateLinePrice = (line: SaleDraftLine) => {
  const product = products.value.find(item => item.id === Number(line.productId))
  line.unitPrice = product?.price ?? ''
}

const productForLine = (line: SaleDraftLine) =>
  products.value.find(product => product.id === Number(line.productId))

const openSaleForm = () => {
  draftLines.value = [{ productId: '', quantity: '', unitPrice: '' }]
  saleError.value = ''
  isSaleDialogOpen.value = true
}

const registerSale = async () => {
  saleError.value = ''
  if (!draftLines.value.length || draftLines.value.some(line => !line.productId)) {
    saleError.value = 'Selecione um produto para cada item da venda.'
    return
  }
  if (draftLines.value.some(line => line.quantity === '' || !Number.isSafeInteger(Number(line.quantity)) || Number(line.quantity) <= 0)) {
    saleError.value = 'Informe uma quantidade inteira maior que zero para cada produto.'
    return
  }

  const saleDate = new Date()
  const date = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}-${String(saleDate.getDate()).padStart(2, '0')}`
  const time = saleDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  try {
    await recordSale({
      date,
      time,
      items: draftLines.value.map((line) => {
        const product = productForLine(line)
        if (!product)
          throw new Error('Um dos produtos selecionados não está mais disponível.')
        return { product, quantity: Number(line.quantity), unitPrice: Number(line.unitPrice) }
      }),
    })
    await loadMonthlySales()
    isSaleDialogOpen.value = false
  }
  catch (error) {
    saleError.value = error instanceof Error ? error.message : 'Não foi possível registrar a venda.'
  }
}

const generateReport = () => window.print()
</script>

<template>
  <section class="sales-screen flex flex-col gap-5">
    <p v-if="inventoryError || (saleError && !isSaleDialogOpen)" role="alert" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
      {{ inventoryError || saleError }}
    </p>
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="mb-3 text-[11px] font-semibold tracking-widest text-muted-foreground">ÁREA DE TRABALHO</p>
        <h1 class="text-4xl font-bold tracking-tight">Vendas do mês</h1>
        <p class="mt-2 text-sm text-muted-foreground">Consulte e gerencie as informações do seu estoque.</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <SelectRoot v-model="selectedMonth">
          <SelectTrigger
            aria-label="Selecionar mês"
            class="inline-flex h-9 min-w-40 items-center justify-between gap-3 rounded-lg border bg-background px-3 text-xs shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <SelectValue />
            <ChevronDown class="size-4 text-muted-foreground" />
          </SelectTrigger>
          <SelectPortal>
            <SelectContent position="popper" align="end" :side-offset="4" class="z-50 max-h-64 min-w-48 overflow-y-auto rounded-lg border bg-popover p-1 shadow-md">
              <SelectItem
                v-for="month in monthOptions"
                :key="month.value"
                :value="month.value"
                class="relative flex cursor-default select-none items-center rounded-md py-1.5 pl-2 pr-8 text-xs capitalize outline-none data-[highlighted]:bg-sidebar-accent"
              >
                <SelectItemText>{{ month.label }}</SelectItemText>
                <SelectItemIndicator class="absolute right-2"><Check class="size-4" /></SelectItemIndicator>
              </SelectItem>
            </SelectContent>
          </SelectPortal>
        </SelectRoot>
        <Button @click="openSaleForm">
          <Plus class="size-4" />
          Registrar venda
        </Button>
      </div>
    </div>

    <Card v-if="monthlySales.length === 0" class="rounded-2xl py-0 shadow-sm">
      <CardContent class="px-5 py-5 text-xs text-muted-foreground">
        {{ isLoadingSales ? 'Carregando vendas...' : 'Ainda não há vendas registradas neste mês.' }}
      </CardContent>
    </Card>

    <Card class="overflow-hidden rounded-2xl py-0 shadow-sm">
      <CardHeader class="flex flex-row items-start justify-between gap-4 border-b px-5 py-4">
        <div>
          <p class="text-[10px] font-semibold tracking-widest text-amber-800">RELATÓRIO MENSAL</p>
          <CardTitle class="mt-1 text-base font-semibold capitalize">Vendas de {{ selectedMonthLabel }}</CardTitle>
          <p class="mt-1 text-xs text-muted-foreground">Confira os produtos vendidos, quantidades e faturamento do mês.</p>
        </div>
        <Button variant="outline" class="shrink-0" @click="generateReport">
          <Download class="size-4" />
          Gerar relatório
        </Button>
      </CardHeader>
      <div class="grid grid-cols-1 divide-y border-b sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div class="px-5 py-3">
          <p class="text-[10px] font-semibold tracking-widest text-muted-foreground">FATURAMENTO</p>
          <p class="mt-1 text-base font-semibold text-primary">{{ formatCurrency(monthlyRevenue) }}</p>
        </div>
        <div class="px-5 py-3">
          <p class="text-[10px] font-semibold tracking-widest text-muted-foreground">ITENS VENDIDOS</p>
          <p class="mt-1 text-base font-semibold">{{ formatQuantity(soldItemCount) }} un.</p>
        </div>
        <div class="px-5 py-3">
          <p class="text-[10px] font-semibold tracking-widest text-muted-foreground">PRODUTOS VENDIDOS</p>
          <p class="mt-1 text-base font-semibold">{{ productSummary.length }} {{ productSummary.length === 1 ? 'item' : 'itens' }}</p>
        </div>
      </div>
      <CardContent v-if="productSummary.length" class="overflow-x-auto p-0">
        <table class="w-full min-w-[500px] text-left text-xs">
          <thead>
            <tr class="border-b text-[10px] font-semibold tracking-widest text-muted-foreground">
              <th class="px-5 py-3">PRODUTO</th>
              <th class="px-4 py-3 text-right">QUANTIDADE</th>
              <th class="px-5 py-3 text-right">FATURAMENTO</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in productSummary" :key="row.product.name" class="border-b last:border-b-0">
              <td class="px-5 py-3 font-medium">{{ row.product.name }}</td>
              <td class="px-4 py-3 text-right">{{ formatQuantity(row.quantity) }} {{ row.product.unit ?? 'un.' }}</td>
              <td class="px-5 py-3 text-right font-medium">{{ formatCurrency(row.revenue) }}</td>
            </tr>
          </tbody>
        </table>
      </CardContent>
      <CardContent v-else class="px-5 py-5 text-xs text-muted-foreground">
        Nenhum produto vendido neste mês.
      </CardContent>
    </Card>

    <Card class="overflow-hidden rounded-2xl py-0 shadow-sm">
      <CardHeader class="flex flex-row items-center justify-between border-b px-5 py-4">
        <CardTitle class="text-sm font-semibold">Vendas registradas</CardTitle>
        <span class="text-xs text-muted-foreground">{{ monthlySales.length }} {{ monthlySales.length === 1 ? 'venda' : 'vendas' }}</span>
      </CardHeader>

      <CardContent v-if="monthlySales.length" class="overflow-x-auto p-0">
        <table class="w-full min-w-[650px] text-left text-xs">
          <thead>
            <tr class="border-b text-[10px] font-semibold tracking-widest text-muted-foreground">
              <th class="px-5 py-3">VENDA</th>
              <th class="px-4 py-3">DATA E HORÁRIO</th>
              <th class="px-4 py-3">PRODUTOS</th>
              <th class="px-4 py-3 text-right">ITENS</th>
              <th class="px-4 py-3 text-right">TOTAL</th>
              <th class="px-5 py-3 text-center">DETALHES</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sale in monthlySales" :key="sale.id" class="border-b last:border-b-0">
              <td class="px-5 py-4 font-semibold">#{{ sale.id }}</td>
              <td class="whitespace-nowrap px-4 py-4 text-muted-foreground">{{ formatSaleDate(sale) }}</td>
              <td class="max-w-64 truncate px-4 py-4">{{ sale.items.map(item => item.product.name).join(', ') }}</td>
              <td class="px-4 py-4 text-right">{{ formatQuantity(sale.items.reduce((sum, item) => sum + item.quantity, 0)) }}</td>
              <td class="whitespace-nowrap px-4 py-4 text-right font-semibold">{{ formatCurrency(saleTotal(sale)) }}</td>
              <td class="px-5 py-4 text-center">
                <button
                  class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  :aria-label="`Detalhes da venda ${sale.id}`"
                  @click="saleDetails = sale"
                >
                  <FileText class="size-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </CardContent>

      <CardContent v-else class="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
        <div class="flex size-11 items-center justify-center rounded-full bg-muted">
          <Receipt class="size-5 text-muted-foreground" />
        </div>
        <h2 class="mt-4 text-sm font-medium capitalize">Nenhuma venda registrada em {{ selectedMonthLabel }}</h2>
        <p class="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
          Registre a primeira venda deste mês para acompanhar o faturamento, os itens vendidos e a baixa automática no estoque.
        </p>
        <Button class="mt-4" @click="openSaleForm">
          <Plus class="size-4" />
          Registrar venda
        </Button>
      </CardContent>
    </Card>

    <DialogRoot v-model:open="isSaleDialogOpen">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-black/35 backdrop-blur-[1px]" />
        <DialogContent class="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-card p-5 shadow-xl outline-none sm:p-6">
          <div class="flex items-start justify-between gap-4">
            <div>
              <DialogTitle class="text-base font-semibold">Registrar venda</DialogTitle>
              <DialogDescription class="mt-1 text-xs text-muted-foreground">
                Adicione os produtos vendidos. O estoque será atualizado ao confirmar.
              </DialogDescription>
            </div>
            <DialogClose aria-label="Fechar" class="rounded-md p-1 text-muted-foreground hover:bg-muted">
              <X class="size-4" />
            </DialogClose>
          </div>

          <form class="mt-5 space-y-4" @submit.prevent="registerSale">
            <div class="space-y-3">
              <div
                v-for="(line, index) in draftLines"
                :key="index"
                class="grid grid-cols-1 items-end gap-3 rounded-xl border p-3 sm:grid-cols-[minmax(0,1fr)_100px_130px_40px]"
              >
                <label class="block space-y-1.5 text-xs font-medium">
                  Produto <span class="text-destructive">*</span>
                  <SelectRoot v-model="line.productId" @update:model-value="updateLinePrice(line)">
                    <SelectTrigger class="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border bg-background px-3 text-xs font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
                      <SelectValue placeholder="Selecione um produto" />
                      <ChevronDown class="size-4 text-muted-foreground" />
                    </SelectTrigger>
                    <SelectPortal>
                      <SelectContent position="popper" align="start" :side-offset="4" class="z-[60] max-h-60 min-w-[var(--reka-select-trigger-width)] overflow-y-auto rounded-lg border bg-popover p-1 shadow-md">
                        <SelectItem
                          v-for="product in activeProducts"
                          :key="product.id"
                          :value="String(product.id)"
                          class="relative flex cursor-default select-none items-center rounded-md py-1.5 pl-2 pr-8 text-xs outline-none data-[highlighted]:bg-sidebar-accent"
                        >
                          <SelectItemText>{{ product.name }} · {{ product.stock }} {{ product.unit ?? 'un.' }}</SelectItemText>
                          <SelectItemIndicator class="absolute right-2"><Check class="size-4" /></SelectItemIndicator>
                        </SelectItem>
                      </SelectContent>
                    </SelectPortal>
                  </SelectRoot>
                </label>
                <label class="block space-y-1.5 text-xs font-medium">
                  Quantidade
                  <input v-model.number="line.quantity" type="number" min="1" step="1" class="h-9 w-full rounded-lg border bg-background px-2 text-xs font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
                </label>
                <label class="block space-y-1.5 text-xs font-medium">
                  Preço unitário
                  <input v-model.number="line.unitPrice" type="number" min="0" step="0.01" readonly class="h-9 w-full rounded-lg border bg-muted px-2 text-xs font-normal outline-none">
                </label>
                <Button
                  v-if="draftLines.length > 1"
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  :aria-label="`Remover produto ${index + 1}`"
                  @click="draftLines.splice(index, 1)"
                >
                  <Trash2 class="size-4 text-muted-foreground" />
                </Button>
                <span v-else class="hidden sm:block" />
              </div>
              <Button type="button" variant="outline" size="sm" @click="addSaleLine">
                <Plus class="size-4" />
                Adicionar produto
              </Button>
            </div>

            <div class="flex items-center justify-between border-t pt-3 text-sm">
              <span class="text-muted-foreground">Total da venda</span>
              <span class="font-semibold">
                {{ formatCurrency(draftLines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.unitPrice || 0), 0)) }}
              </span>
            </div>

            <p v-if="saleError" role="alert" class="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              {{ saleError }}
            </p>
            <div class="flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" @click="isSaleDialogOpen = false">Cancelar</Button>
              <Button type="submit">
                <Receipt class="size-4" />
                Confirmar venda
              </Button>
            </div>
          </form>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <DialogRoot :open="saleDetails !== null" @update:open="!$event && (saleDetails = null)">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-black/35 backdrop-blur-[1px]" />
        <DialogContent class="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-card p-5 shadow-xl outline-none">
          <template v-if="saleDetails">
            <div class="flex items-start justify-between gap-4">
              <div>
                <DialogTitle class="text-base font-semibold">Venda #{{ saleDetails.id }}</DialogTitle>
                <DialogDescription class="mt-1 text-xs text-muted-foreground">{{ formatSaleDate(saleDetails) }}</DialogDescription>
              </div>
              <DialogClose aria-label="Fechar" class="rounded-md p-1 text-muted-foreground hover:bg-muted">
                <X class="size-4" />
              </DialogClose>
            </div>
            <div class="mt-4 divide-y border-y">
              <div v-for="(item, index) in saleDetails.items" :key="`${item.product.name}-${index}`" class="flex justify-between gap-4 py-3 text-xs">
                <div>
                  <p class="font-medium">{{ item.product.name }}</p>
                  <p class="mt-1 text-muted-foreground">{{ formatQuantity(item.quantity) }} {{ item.product.unit ?? 'un.' }} × {{ formatCurrency(item.unitPrice) }}</p>
                </div>
                <p class="shrink-0 font-medium">{{ formatCurrency(item.quantity * item.unitPrice) }}</p>
              </div>
            </div>
            <div class="flex justify-between pt-3 text-sm font-semibold">
              <span>Total</span>
              <span>{{ formatCurrency(saleTotal(saleDetails)) }}</span>
            </div>
          </template>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <article class="print-report">
      <header class="print-report-header">
        <div class="print-brand">
          <img src="/logo.png" alt="">
          <div><strong>Estoque+</strong><small>GESTÃO SIMPLES</small></div>
        </div>
        <p>RELATÓRIO MENSAL</p>
        <h1 class="capitalize">Vendas de {{ selectedMonthLabel }}</h1>
        <span>Gerado em {{ new Date().toLocaleDateString('pt-BR') }}</span>
      </header>
      <section class="print-summary">
        <div><small>FATURAMENTO</small><strong>{{ formatCurrency(monthlyRevenue) }}</strong></div>
        <div><small>ITENS VENDIDOS</small><strong>{{ formatQuantity(soldItemCount) }}</strong></div>
        <div><small>PRODUTOS VENDIDOS</small><strong>{{ productSummary.length }}</strong></div>
        <div><small>VENDAS REGISTRADAS</small><strong>{{ monthlySales.length }}</strong></div>
      </section>
      <h2>Resumo por produto</h2>
      <table class="print-table">
        <thead><tr><th>Produto</th><th>Quantidade</th><th>Faturamento</th></tr></thead>
        <tbody>
          <tr v-for="row in productSummary" :key="row.product.name">
            <td>{{ row.product.name }}</td>
            <td>{{ formatQuantity(row.quantity) }} {{ row.product.unit ?? 'un.' }}</td>
            <td>{{ formatCurrency(row.revenue) }}</td>
          </tr>
          <tr v-if="productSummary.length === 0"><td colspan="3">Nenhum produto vendido neste mês.</td></tr>
        </tbody>
      </table>
      <h2>Vendas registradas</h2>
      <table class="print-table">
        <thead><tr><th>Venda</th><th>Data e horário</th><th>Produtos</th><th>Total</th></tr></thead>
        <tbody>
          <tr v-for="sale in monthlySales" :key="sale.id">
            <td>#{{ sale.id }}</td>
            <td>{{ formatSaleDate(sale) }}</td>
            <td>{{ sale.items.map(item => `${item.product.name} (${formatQuantity(item.quantity)})`).join(', ') }}</td>
            <td>{{ formatCurrency(saleTotal(sale)) }}</td>
          </tr>
          <tr v-if="monthlySales.length === 0"><td colspan="4">Nenhuma venda registrada neste mês.</td></tr>
        </tbody>
      </table>
      <footer>Estoque+ · Relatório gerado pelo sistema de gestão de estoque.</footer>
    </article>
  </section>
</template>

<style scoped>
.print-report {
  display: none;
}

@media print {
  @page {
    margin: 18mm;
    size: A4;
  }

  :global(body *) {
    visibility: hidden !important;
  }

  :global(body) {
    background: white !important;
  }

  .sales-screen {
    display: block !important;
  }

  .print-report,
  .print-report * {
    visibility: visible !important;
  }

  .print-report {
    position: absolute;
    inset: 0;
    display: block !important;
    color: #202820;
    background: white;
    font-family: Arial, sans-serif;
  }

  .print-report-header {
    padding-bottom: 20px;
    border-bottom: 1px solid #dfe4df;
  }

  .print-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 28px;
  }

  .print-brand img {
    width: 36px;
    height: 36px;
    border-radius: 8px;
  }

  .print-brand strong,
  .print-brand small {
    display: block;
  }

  .print-brand small {
    margin-top: 2px;
    color: #68756c;
    font-size: 8px;
    letter-spacing: 1px;
  }

  .print-report-header > p {
    color: #8a6743;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1.4px;
  }

  .print-report-header h1 {
    margin: 6px 0;
    font-size: 23px;
  }

  .print-report-header > span,
  .print-report footer {
    color: #68756c;
    font-size: 10px;
  }

  .print-summary {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    padding: 18px 0;
    border-bottom: 1px solid #dfe4df;
  }

  .print-summary small,
  .print-summary strong {
    display: block;
  }

  .print-summary small {
    color: #68756c;
    font-size: 8px;
    letter-spacing: 1px;
  }

  .print-summary strong {
    margin-top: 6px;
    font-size: 14px;
  }

  .print-report h2 {
    margin: 22px 0 8px;
    font-size: 13px;
  }

  .print-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10px;
  }

  .print-table th,
  .print-table td {
    padding: 8px;
    border-bottom: 1px solid #e8ebe8;
    text-align: left;
  }

  .print-table th {
    background: #f3f5f3;
    color: #59665d;
    font-size: 8px;
    letter-spacing: 0.6px;
    text-transform: uppercase;
  }

  .print-report footer {
    margin-top: 28px;
    padding-top: 10px;
    border-top: 1px solid #dfe4df;
  }
}
</style>
