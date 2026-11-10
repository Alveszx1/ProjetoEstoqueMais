<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowDown, ArrowLeftRight, ArrowUp, Check, ChevronDown, Eye, Plus, X } from 'lucide-vue-next'
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
import { inventoryError, products, recordMovement, stockMovements } from '@/lib/inventory'
import type { Product, StockMovement } from '@/lib/inventory'

const props = defineProps<{ openCreateRequest?: number }>()

const dateFilter = ref('30')
const productFilter = ref('all')
const typeFilter = ref('all')
const isCreateDialogOpen = ref(false)
const selectedMovement = ref<StockMovement | null>(null)
const movementType = ref<'Entrada' | 'Saída'>('Entrada')
const selectedProductId = ref('')
const quantity = ref<number | ''>('')
const reason = ref('')
const formError = ref('')

const productOptions = computed(() => products.value.filter(product => !product.inactive))

const visibleMovements = computed(() => {
  const now = new Date()
  const limit = dateFilter.value === 'all' ? null : Number(dateFilter.value)

  return stockMovements.value.filter((movement) => {
    const matchesProduct = productFilter.value === 'all'
      || movement.product.name === productFilter.value
    const matchesType = typeFilter.value === 'all' || movement.type === typeFilter.value
    const dateParts = movement.date.split('/').map(Number)
    const [day, month, year] = dateParts
    const movementDate = dateParts.length === 3 && day !== undefined && month !== undefined && year !== undefined
      ? new Date(year, month - 1, day)
      : new Date(Number.NaN)
    const matchesDate = limit === null
      || (now.getTime() - movementDate.getTime()) / 86_400_000 <= limit

    return matchesProduct && matchesType && matchesDate
  })
})

const dateOptions = [
  { label: 'Últimos 7 dias', value: '7' },
  { label: 'Últimos 30 dias', value: '30' },
  { label: 'Últimos 90 dias', value: '90' },
  { label: 'Todo o período', value: 'all' },
]

const formatDateTime = (movement: StockMovement) =>
  `${movement.date} ${movement.time}`

const resetMovementForm = () => {
  movementType.value = 'Entrada'
  selectedProductId.value = ''
  quantity.value = ''
  reason.value = ''
  formError.value = ''
}

const registerMovement = async () => {
  const product = products.value.find(item => item.id === Number(selectedProductId.value))
  if (!product) {
    formError.value = 'Selecione um produto.'
    return
  }
  if (quantity.value === '' || !Number.isSafeInteger(Number(quantity.value)) || Number(quantity.value) <= 0) {
    formError.value = 'Informe uma quantidade inteira maior que zero.'
    return
  }
  if (!reason.value.trim()) {
    formError.value = 'Informe o motivo da movimentação.'
    return
  }

  const now = new Date()
  const date = now.toLocaleDateString('pt-BR')
  const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  try {
    await recordMovement({
      product,
      type: movementType.value,
      quantity: Number(quantity.value),
      reason: reason.value.trim(),
      date,
      time,
    })
    isCreateDialogOpen.value = false
    resetMovementForm()
  }
  catch (error) {
    formError.value = error instanceof Error ? error.message : 'Não foi possível registrar a movimentação.'
  }
}

const showMovementDetails = (movement: StockMovement) => {
  selectedMovement.value = movement
}

const closeDetails = () => {
  selectedMovement.value = null
}

const productUnit = (product: Product) => product.unit ?? 'un.'

watch(() => props.openCreateRequest, (request) => {
  if (request) {
    resetMovementForm()
    isCreateDialogOpen.value = true
  }
})
</script>

<template>
  <section class="flex flex-col gap-6">
    <p v-if="inventoryError" role="alert" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
      {{ inventoryError }}
    </p>
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="mb-3 text-[11px] font-semibold tracking-widest text-muted-foreground">ÁREA DE TRABALHO</p>
        <h1 class="text-4xl font-bold tracking-tight">Movimentações</h1>
        <p class="mt-2 text-sm text-muted-foreground">Consulte e gerencie as informações do seu estoque.</p>
      </div>
      <Button @click="isCreateDialogOpen = true; resetMovementForm()">
        <Plus class="size-4" />
        Registrar movimentação
      </Button>
    </div>

    <Card class="overflow-hidden rounded-2xl py-0 shadow-sm">
      <CardHeader class="flex flex-row items-center justify-between border-b px-5 py-4">
        <CardTitle class="text-sm font-semibold">Histórico de movimentações</CardTitle>
        <span class="text-xs text-muted-foreground">{{ visibleMovements.length }} lançamentos</span>
      </CardHeader>

      <CardContent class="p-0">
        <div class="flex flex-wrap items-center gap-2 border-b px-5 py-3">
          <SelectRoot v-model="dateFilter">
            <SelectTrigger
              aria-label="Filtrar por período"
              class="inline-flex h-9 min-w-36 items-center justify-between gap-3 rounded-lg border bg-background px-3 text-xs shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <SelectValue />
              <ChevronDown class="size-4 text-muted-foreground" />
            </SelectTrigger>
            <SelectPortal>
              <SelectContent position="popper" align="start" :side-offset="4" class="z-50 min-w-40 rounded-lg border bg-popover p-1 shadow-md">
                <SelectItem
                  v-for="option in dateOptions"
                  :key="option.value"
                  :value="option.value"
                  class="relative flex cursor-default select-none items-center rounded-md py-1.5 pl-2 pr-8 text-xs outline-none data-[highlighted]:bg-sidebar-accent"
                >
                  <SelectItemText>{{ option.label }}</SelectItemText>
                  <SelectItemIndicator class="absolute right-2"><Check class="size-4" /></SelectItemIndicator>
                </SelectItem>
              </SelectContent>
            </SelectPortal>
          </SelectRoot>

          <SelectRoot v-model="productFilter">
            <SelectTrigger
              aria-label="Filtrar por produto"
              class="inline-flex h-9 min-w-44 items-center justify-between gap-3 rounded-lg border bg-background px-3 text-xs shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <SelectValue />
              <ChevronDown class="size-4 text-muted-foreground" />
            </SelectTrigger>
            <SelectPortal>
              <SelectContent position="popper" align="start" :side-offset="4" class="z-50 min-w-[var(--reka-select-trigger-width)] rounded-lg border bg-popover p-1 shadow-md">
                <SelectItem
                  v-for="option in [{ name: 'Todos os produtos', value: 'all' }, ...products.map(product => ({ name: product.name, value: product.name }))]"
                  :key="option.value"
                  :value="option.value"
                  class="relative flex cursor-default select-none items-center rounded-md py-1.5 pl-2 pr-8 text-xs outline-none data-[highlighted]:bg-sidebar-accent"
                >
                  <SelectItemText>{{ option.name }}</SelectItemText>
                  <SelectItemIndicator class="absolute right-2"><Check class="size-4" /></SelectItemIndicator>
                </SelectItem>
              </SelectContent>
            </SelectPortal>
          </SelectRoot>

          <SelectRoot v-model="typeFilter">
            <SelectTrigger
              aria-label="Filtrar por tipo"
              class="inline-flex h-9 min-w-36 items-center justify-between gap-3 rounded-lg border bg-background px-3 text-xs shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <SelectValue />
              <ChevronDown class="size-4 text-muted-foreground" />
            </SelectTrigger>
            <SelectPortal>
              <SelectContent position="popper" align="start" :side-offset="4" class="z-50 min-w-40 rounded-lg border bg-popover p-1 shadow-md">
                <SelectItem
                  v-for="option in [{ label: 'Entradas e saídas', value: 'all' }, { label: 'Entradas', value: 'Entrada' }, { label: 'Saídas', value: 'Saída' }]"
                  :key="option.value"
                  :value="option.value"
                  class="relative flex cursor-default select-none items-center rounded-md py-1.5 pl-2 pr-8 text-xs outline-none data-[highlighted]:bg-sidebar-accent"
                >
                  <SelectItemText>{{ option.label }}</SelectItemText>
                  <SelectItemIndicator class="absolute right-2"><Check class="size-4" /></SelectItemIndicator>
                </SelectItem>
              </SelectContent>
            </SelectPortal>
          </SelectRoot>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr class="border-b text-[10px] font-semibold tracking-widest text-muted-foreground">
                <th class="px-5 py-3">DATA E HORÁRIO</th>
                <th class="px-4 py-3">PRODUTO</th>
                <th class="px-4 py-3">TIPO</th>
                <th class="px-4 py-3 text-right">QUANTIDADE</th>
                <th class="px-4 py-3">MOTIVO</th>
                <th class="px-5 py-3 text-center">DETALHES</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="movement in visibleMovements" :key="movement.id" class="border-b last:border-b-0">
                <td class="whitespace-nowrap px-5 py-4 text-xs text-muted-foreground">{{ formatDateTime(movement) }}</td>
                <td class="px-4 py-4 text-xs font-semibold">{{ movement.product.name }}</td>
                <td class="px-4 py-4">
                  <span
                    class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium"
                    :class="movement.type === 'Entrada'
                      ? 'border-primary/20 bg-primary/10 text-primary'
                      : 'border-red-200 bg-red-50 text-red-700'"
                  >
                    <Plus v-if="movement.type === 'Entrada'" class="size-3" />
                    <span v-else class="font-semibold">−</span>
                    {{ movement.type }}
                  </span>
                </td>
                <td
                  class="whitespace-nowrap px-4 py-4 text-right text-xs font-semibold"
                  :class="movement.type === 'Entrada' ? 'text-primary' : 'text-red-700'"
                >
                  {{ movement.type === 'Entrada' ? '+' : '−' }}{{ movement.quantity }} {{ productUnit(movement.product) }}
                </td>
                <td class="px-4 py-4 text-xs text-muted-foreground">{{ movement.reason }}</td>
                <td class="px-5 py-4 text-center">
                  <button
                    class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    :aria-label="`Ver movimentação de ${movement.product.name}`"
                    @click="showMovementDetails(movement)"
                  >
                    <Eye class="size-4" />
                  </button>
                </td>
              </tr>
              <tr v-if="visibleMovements.length === 0">
                <td colspan="6" class="px-5 py-12 text-center text-sm text-muted-foreground">
                  Nenhuma movimentação encontrada para esses filtros.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    <DialogRoot v-model:open="isCreateDialogOpen">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-black/35 backdrop-blur-[1px]" />
        <DialogContent class="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-card p-5 shadow-xl outline-none sm:p-6">
          <div class="flex items-start justify-between gap-4">
            <div>
              <DialogTitle class="text-base font-semibold">Registrar movimentação</DialogTitle>
              <DialogDescription class="mt-1 text-xs text-muted-foreground">
                Registre uma entrada ou saída para atualizar o saldo do produto.
              </DialogDescription>
            </div>
            <button aria-label="Fechar" class="rounded-md p-1 text-muted-foreground hover:bg-muted" @click="isCreateDialogOpen = false">
              <X class="size-4" />
            </button>
          </div>

          <form class="mt-5 space-y-4" @submit.prevent="registerMovement">
            <label class="block space-y-1.5 text-xs font-medium">
              Produto <span class="text-destructive">*</span>
              <SelectRoot v-model="selectedProductId">
                <SelectTrigger class="inline-flex h-10 w-full items-center justify-between gap-2 rounded-xl border bg-background px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
                  <SelectValue placeholder="Selecione um produto" />
                  <ChevronDown class="size-4 text-muted-foreground" />
                </SelectTrigger>
                <SelectPortal>
                  <SelectContent position="popper" align="start" :side-offset="4" class="z-[60] min-w-[var(--reka-select-trigger-width)] rounded-lg border bg-popover p-1 shadow-md">
                    <SelectItem
                      v-for="product in productOptions"
                      :key="product.id"
                      :value="String(product.id)"
                      class="relative flex cursor-default select-none items-center rounded-md py-1.5 pl-2 pr-8 text-sm outline-none data-[highlighted]:bg-sidebar-accent"
                    >
                      <SelectItemText>{{ product.name }} · {{ product.stock }} {{ productUnit(product) }}</SelectItemText>
                      <SelectItemIndicator class="absolute right-2"><Check class="size-4" /></SelectItemIndicator>
                    </SelectItem>
                  </SelectContent>
                </SelectPortal>
              </SelectRoot>
            </label>

            <fieldset class="space-y-1.5">
              <legend class="text-xs font-medium">Tipo de movimentação <span class="text-destructive">*</span></legend>
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  class="flex h-10 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors"
                  :class="movementType === 'Entrada' ? 'border-primary bg-primary/10 text-primary' : 'bg-background text-muted-foreground hover:bg-muted'"
                  @click="movementType = 'Entrada'"
                >
                  <ArrowDown class="size-4" />
                  Entrada
                </button>
                <button
                  type="button"
                  class="flex h-10 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors"
                  :class="movementType === 'Saída' ? 'border-red-300 bg-red-50 text-red-700' : 'bg-background text-muted-foreground hover:bg-muted'"
                  @click="movementType = 'Saída'"
                >
                  <ArrowUp class="size-4" />
                  Saída
                </button>
              </div>
            </fieldset>

            <label class="block space-y-1.5 text-xs font-medium">
              Quantidade <span class="text-destructive">*</span>
              <input
                v-model.number="quantity"
                type="number"
                min="1"
                step="1"
                required
                class="h-10 w-full rounded-xl border bg-background px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                placeholder="Informe a quantidade"
              >
            </label>

            <label class="block space-y-1.5 text-xs font-medium">
              Motivo <span class="text-destructive">*</span>
              <input
                v-model="reason"
                required
                class="h-10 w-full rounded-xl border bg-background px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                placeholder="Ex.: Compra de fornecedor ou venda"
              >
            </label>

            <p v-if="formError" role="alert" class="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              {{ formError }}
            </p>

            <div class="flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" @click="isCreateDialogOpen = false">
                Cancelar
              </Button>
              <Button type="submit">
                <ArrowLeftRight class="size-4" />
                Registrar movimentação
              </Button>
            </div>
          </form>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <DialogRoot :open="selectedMovement !== null" @update:open="!$event && closeDetails()">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-black/35 backdrop-blur-[1px]" />
        <DialogContent class="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-card p-5 shadow-xl outline-none">
          <template v-if="selectedMovement">
            <div class="flex items-start justify-between">
              <div>
                <DialogTitle class="text-base font-semibold">Detalhes da movimentação</DialogTitle>
                <DialogDescription class="mt-1 text-xs text-muted-foreground">
                  Informações do lançamento no estoque.
                </DialogDescription>
              </div>
              <DialogClose aria-label="Fechar" class="rounded-md p-1 text-muted-foreground hover:bg-muted">
                <X class="size-4" />
              </DialogClose>
            </div>
            <dl class="mt-5 space-y-3 text-xs">
              <div class="flex justify-between gap-3"><dt class="text-muted-foreground">Produto</dt><dd class="text-right font-medium">{{ selectedMovement.product.name }}</dd></div>
              <div class="flex justify-between gap-3"><dt class="text-muted-foreground">Tipo</dt><dd class="font-medium">{{ selectedMovement.type }}</dd></div>
              <div class="flex justify-between gap-3"><dt class="text-muted-foreground">Quantidade</dt><dd class="font-medium">{{ selectedMovement.quantity }} {{ productUnit(selectedMovement.product) }}</dd></div>
              <div class="flex justify-between gap-3"><dt class="text-muted-foreground">Motivo</dt><dd class="text-right font-medium">{{ selectedMovement.reason }}</dd></div>
              <div class="flex justify-between gap-3"><dt class="text-muted-foreground">Data e horário</dt><dd class="font-medium">{{ formatDateTime(selectedMovement) }}</dd></div>
              <div class="flex justify-between gap-3"><dt class="text-muted-foreground">Saldo atual</dt><dd class="font-medium">{{ selectedMovement.product.stock }} {{ productUnit(selectedMovement.product) }}</dd></div>
            </dl>
          </template>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </section>
</template>
