<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Ban, Check, ChevronDown, Clock3, Ellipsis, Eye, Info, Minus, Pencil, Plus, Search, X } from 'lucide-vue-next'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
import { inventoryError, productCategories, products, reloadInventory } from '@/lib/inventory'
import type { Product } from '@/lib/inventory'
import { createProductFromApi, setProductActiveFromApi, updateProductFromApi } from '@/services/estoqueApi'

const props = defineProps<{ openCreateRequest?: number }>()

type ProductStatus = 'Sem estoque' | 'Estoque baixo' | 'Em estoque'

const search = ref('')
const selectedCategory = ref('Todas as categorias')
const selectedStatus = ref('Todas as situações')
const showInactive = ref(false)
const isProductDialogOpen = ref(false)
const isEditingProduct = ref(false)
const isCreatingProduct = ref(false)
const selectedProduct = ref<Product | null>(null)
const editDraft = ref<Product | null>(null)
const selectedCategoryId = ref('')
const productError = ref('')
const isSaving = ref(false)
const categories = computed(() => [...new Set([
  ...productCategories.value.map(category => category.nome),
  ...products.value.map(product => product.category),
])])

const getStatus = (product: Product): ProductStatus => {
  if (product.stock === 0)
    return 'Sem estoque'
  if (product.stock <= product.minimum)
    return 'Estoque baixo'
  return 'Em estoque'
}

const filteredProducts = computed(() => products.value.filter((product) => {
  const searchTerm = search.value.trim().toLocaleLowerCase('pt-BR')
  const matchesSearch = !searchTerm
    || product.name.toLocaleLowerCase('pt-BR').includes(searchTerm)
    || product.description.toLocaleLowerCase('pt-BR').includes(searchTerm)
  const matchesCategory = selectedCategory.value === 'Todas as categorias'
    || product.category === selectedCategory.value
  const status = getStatus(product)
  const matchesStatus = selectedStatus.value === 'Todas as situações'
    || status === selectedStatus.value

  return matchesSearch
    && matchesCategory
    && matchesStatus
    && (showInactive.value || !product.inactive)
}))

const formatCurrency = (price: number) =>
  price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const toggleInactive = async (product: Product) => {
  if (!product.id)
    return
  productError.value = ''
  try {
    await setProductActiveFromApi(product.id, product.inactive === true)
    await reloadInventory()
    if (inventoryError.value)
      productError.value = inventoryError.value
  }
  catch (error) {
    productError.value = error instanceof Error ? error.message : 'Não foi possível atualizar o produto.'
  }
}

const openProductDetails = (product: Product) => {
  selectedProduct.value = product
  isEditingProduct.value = false
  isCreatingProduct.value = false
  isProductDialogOpen.value = true
}

const openProductEditor = (product: Product) => {
  selectedProduct.value = product
  editDraft.value = { ...product, movements: product.movements }
  selectedCategoryId.value = String(product.categoryId ?? '')
  isEditingProduct.value = true
  isCreatingProduct.value = false
  isProductDialogOpen.value = true
}

const openProductCreate = () => {
  selectedProduct.value = null
  editDraft.value = {
    name: '',
    description: '',
    category: '',
    price: 0,
    stock: 0,
    minimum: 0,
    unit: 'un.',
  }
  selectedCategoryId.value = String(productCategories.value[0]?.id ?? '')
  isEditingProduct.value = true
  isCreatingProduct.value = true
  isProductDialogOpen.value = true
}

watch(() => props.openCreateRequest, (request) => {
  if (request)
    openProductCreate()
})

const startEditingSelectedProduct = () => {
  if (!selectedProduct.value)
    return

  editDraft.value = { ...selectedProduct.value, movements: selectedProduct.value.movements }
  selectedCategoryId.value = String(selectedProduct.value.categoryId ?? '')
  isEditingProduct.value = true
  isCreatingProduct.value = false
}

const saveProduct = async () => {
  if (!editDraft.value)
    return
  const categoryId = Number(selectedCategoryId.value)
  if (!Number.isSafeInteger(categoryId) || categoryId < 1) {
    productError.value = 'Selecione uma categoria cadastrada no backend.'
    return
  }

  const payload = {
    nome: editDraft.value.name.trim(),
    descricao: editDraft.value.description.trim(),
    preco_unitario: Number(editDraft.value.price),
    estoque_minimo: Number(editDraft.value.minimum),
    id_categoria: categoryId,
  }

  productError.value = ''
  isSaving.value = true
  try {
    if (isCreatingProduct.value)
      await createProductFromApi(payload)
    else if (selectedProduct.value?.id)
      await updateProductFromApi(selectedProduct.value.id, payload)
    else
      throw new Error('Produto sem identificador válido no backend.')

    await reloadInventory()
    if (inventoryError.value)
      throw new Error(inventoryError.value)
    isProductDialogOpen.value = false
    isCreatingProduct.value = false
    isEditingProduct.value = false
    editDraft.value = null
  }
  catch (error) {
    productError.value = error instanceof Error ? error.message : 'Não foi possível salvar o produto.'
  }
  finally {
    isSaving.value = false
  }
}
</script>

<template>
  <section class="flex flex-col gap-6">
    <p v-if="inventoryError || productError" role="alert" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
      {{ productError || inventoryError }}
    </p>
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="mb-3 text-[11px] font-semibold tracking-widest text-muted-foreground">ÁREA DE TRABALHO</p>
        <h1 class="text-4xl font-bold tracking-tight">Produtos</h1>
        <p class="mt-2 text-sm text-muted-foreground">Consulte e gerencie as informações do seu estoque.</p>
      </div>

      <Button @click="openProductCreate">
        <Plus class="size-4" />
        Cadastrar produto
      </Button>
    </div>

    <Card class="overflow-hidden rounded-2xl py-0 shadow-sm">
      <CardHeader class="flex flex-row items-center justify-between border-b px-5 py-4">
        <CardTitle class="text-sm font-semibold">Produtos cadastrados</CardTitle>
        <span class="text-xs text-muted-foreground">{{ filteredProducts.length }} produtos</span>
      </CardHeader>

      <CardContent class="p-0">
        <div class="flex flex-wrap items-center gap-2 border-b px-5 py-3">
          <label class="relative min-w-48 flex-1 sm:max-w-xs">
            <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              v-model="search"
              type="search"
              placeholder="Buscar por nome do produto..."
              class="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
            >
          </label>

          <SelectRoot v-model="selectedCategory">
            <SelectTrigger
              aria-label="Filtrar por categoria"
              class="inline-flex h-9 min-w-36 items-center justify-between gap-3 rounded-lg border bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <SelectValue />
              <ChevronDown class="size-4 text-muted-foreground" />
            </SelectTrigger>
            <SelectPortal>
              <SelectContent
                position="popper"
                align="start"
                :side-offset="4"
                class="z-50 min-w-[var(--reka-select-trigger-width)] overflow-hidden rounded-lg border bg-popover p-1 shadow-md"
              >
                <SelectItem
                  v-for="category in ['Todas as categorias', ...categories]"
                  :key="category"
                  :value="category"
                  class="relative flex cursor-default select-none items-center rounded-md py-1.5 pl-2 pr-8 text-sm outline-none data-[highlighted]:bg-sidebar-accent data-[highlighted]:text-sidebar-accent-foreground data-[state=checked]:bg-sidebar-accent data-[state=checked]:text-sidebar-accent-foreground"
                >
                  <SelectItemText>{{ category }}</SelectItemText>
                  <SelectItemIndicator class="absolute right-2 inline-flex items-center justify-center">
                    <Check class="size-4" />
                  </SelectItemIndicator>
                </SelectItem>
              </SelectContent>
            </SelectPortal>
          </SelectRoot>

          <SelectRoot v-model="selectedStatus">
            <SelectTrigger
              aria-label="Filtrar por situação"
              class="inline-flex h-9 min-w-40 items-center justify-between gap-3 rounded-lg border bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <SelectValue />
              <ChevronDown class="size-4 text-muted-foreground" />
            </SelectTrigger>
            <SelectPortal>
              <SelectContent
                position="popper"
                align="start"
                :side-offset="4"
                class="z-50 min-w-[var(--reka-select-trigger-width)] overflow-hidden rounded-lg border bg-popover p-1 shadow-md"
              >
                <SelectItem
                  v-for="status in ['Todas as situações', 'Em estoque', 'Estoque baixo', 'Sem estoque']"
                  :key="status"
                  :value="status"
                  class="relative flex cursor-default select-none items-center rounded-md py-1.5 pl-2 pr-8 text-sm outline-none data-[highlighted]:bg-sidebar-accent data-[highlighted]:text-sidebar-accent-foreground data-[state=checked]:bg-sidebar-accent data-[state=checked]:text-sidebar-accent-foreground"
                >
                  <SelectItemText>{{ status }}</SelectItemText>
                  <SelectItemIndicator class="absolute right-2 inline-flex items-center justify-center">
                    <Check class="size-4" />
                  </SelectItemIndicator>
                </SelectItem>
              </SelectContent>
            </SelectPortal>
          </SelectRoot>

          <label class="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            <input v-model="showInactive" type="checkbox" class="size-4 accent-primary" >
            Mostrar inativos
          </label>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr class="border-b text-[10px] font-semibold tracking-widest text-muted-foreground">
                <th class="px-5 py-3">PRODUTO</th>
                <th class="px-4 py-3">CATEGORIA</th>
                <th class="px-4 py-3 text-right">PREÇO UNIT.</th>
                <th class="px-4 py-3 text-right">ESTOQUE</th>
                <th class="px-4 py-3 text-right">MÍNIMO</th>
                <th class="px-4 py-3 text-center">SITUAÇÃO</th>
                <th class="px-5 py-3 text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in filteredProducts" :key="product.id" class="border-b last:border-b-0">
                <td class="max-w-64 px-5 py-3">
                  <p class="truncate text-xs font-semibold">{{ product.name }}</p>
                  <p class="mt-0.5 truncate text-[11px] text-muted-foreground">{{ product.description }}</p>
                </td>
                <td class="px-4 py-3 text-xs text-muted-foreground">{{ product.category }}</td>
                <td class="px-4 py-3 text-right text-xs font-medium">{{ formatCurrency(product.price) }}</td>
                <td class="px-4 py-3 text-right text-xs font-semibold">{{ product.stock }} {{ product.unit ?? 'un.' }}</td>
                <td class="px-4 py-3 text-right text-xs text-muted-foreground">{{ product.minimum }} {{ product.unit ?? 'un.' }}</td>
                <td class="px-4 py-3 text-center">
                  <span
                    class="inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-medium"
                    :class="{
                      'border-red-200 bg-red-50 text-red-700': getStatus(product) === 'Sem estoque',
                      'border-amber-200 bg-amber-50 text-amber-700': getStatus(product) === 'Estoque baixo',
                      'border-primary/20 bg-primary/10 text-primary': getStatus(product) === 'Em estoque',
                    }"
                  >
                    {{ getStatus(product) }}
                  </span>
                </td>
                <td class="px-5 py-2 text-right">
                  <DropdownMenuRoot>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="icon-sm" :aria-label="`Ações para ${product.name}`">
                        <Ellipsis class="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuContent
                        align="end"
                        :side-offset="4"
                        class="z-50 min-w-40 overflow-hidden rounded-xl border bg-popover p-1 shadow-md"
                      >
                        <DropdownMenuItem
                          class="flex cursor-default items-center gap-3 rounded-lg px-2 py-2 text-xs outline-none data-[highlighted]:bg-sidebar-accent data-[highlighted]:text-sidebar-accent-foreground"
                          @select="openProductDetails(product)"
                        >
                          <Eye class="size-4" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          class="flex cursor-default items-center gap-3 rounded-lg px-2 py-2 text-xs outline-none data-[highlighted]:bg-sidebar-accent data-[highlighted]:text-sidebar-accent-foreground"
                          @select="openProductEditor(product)"
                        >
                          <Pencil class="size-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator class="my-1 h-px bg-border" />
                        <DropdownMenuItem
                          class="flex cursor-default items-center gap-3 rounded-lg px-2 py-2 text-xs text-destructive outline-none data-[highlighted]:bg-red-50 data-[highlighted]:text-red-700"
                          @select="toggleInactive(product)"
                        >
                          <Ban class="size-4" />
                          {{ product.inactive ? 'Ativar' : 'Inativar' }}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenuPortal>
                  </DropdownMenuRoot>
                </td>
              </tr>
              <tr v-if="filteredProducts.length === 0">
                <td colspan="7" class="px-5 py-10 text-center text-sm text-muted-foreground">
                  Nenhum produto encontrado com esses filtros.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    <DialogRoot v-model:open="isProductDialogOpen">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-black/35 backdrop-blur-[1px]" />
        <DialogContent
          class="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-card p-5 shadow-xl outline-none sm:p-6"
          @open-auto-focus.prevent
        >
          <template v-if="selectedProduct || isCreatingProduct">
            <div class="flex items-start justify-between gap-4">
              <div v-if="isCreatingProduct">
                <DialogTitle class="text-base font-semibold">Cadastrar produto</DialogTitle>
                <DialogDescription class="mt-1 text-xs text-muted-foreground">
                  Preencha os dados do produto. O saldo inicial é informado em Movimentações.
                </DialogDescription>
              </div>
              <div v-else-if="!isEditingProduct && selectedProduct">
                <DialogTitle class="text-base font-semibold leading-tight">
                  {{ selectedProduct.name }}
                </DialogTitle>
                <DialogDescription class="sr-only">
                  Detalhes do produto {{ selectedProduct.name }}
                </DialogDescription>
                <div class="mt-2 flex items-center gap-2">
                  <span
                    class="inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-medium"
                    :class="{
                      'border-red-200 bg-red-50 text-red-700': getStatus(selectedProduct) === 'Sem estoque',
                      'border-amber-200 bg-amber-50 text-amber-700': getStatus(selectedProduct) === 'Estoque baixo',
                      'border-primary/20 bg-primary/10 text-primary': getStatus(selectedProduct) === 'Em estoque',
                    }"
                  >
                    {{ getStatus(selectedProduct) }}
                  </span>
                  <span class="text-xs text-muted-foreground">{{ selectedProduct.category }}</span>
                </div>
              </div>
              <div v-else-if="!isCreatingProduct">
                <DialogTitle class="text-base font-semibold">Editar produto</DialogTitle>
                <DialogDescription class="mt-1 text-xs text-muted-foreground">
                  Atualize as informações do produto.
                </DialogDescription>
              </div>
              <DialogClose
                aria-label="Fechar"
                class="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X class="size-4" />
              </DialogClose>
            </div>

            <form
              v-if="isEditingProduct && editDraft"
              class="mt-5 space-y-4"
              @submit.prevent="saveProduct"
            >
              <label class="block space-y-1.5 text-xs font-medium">
                Nome do produto <span class="text-destructive">*</span>
                <input
                  v-model="editDraft.name"
                  required
                  :placeholder="isCreatingProduct ? 'Ex.: Cimento CP II 50kg' : ''"
                  class="h-9 w-full rounded-xl border bg-background px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                >
              </label>
              <label class="block space-y-1.5 text-xs font-medium">
                Descrição
                <textarea
                  v-model="editDraft.description"
                  rows="2"
                  class="w-full resize-y rounded-xl border bg-background px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                />
                <span class="block text-[11px] font-normal text-muted-foreground">
                  Opcional. Use para detalhes como marca, medidas ou aplicação.
                </span>
              </label>
              <div>
                <label class="block space-y-1.5 text-xs font-medium">
                  Categoria <span class="text-destructive">*</span>
                  <SelectRoot v-model="selectedCategoryId">
                    <SelectTrigger
                      aria-label="Categoria do produto"
                      class="inline-flex h-9 w-full items-center justify-between gap-2 rounded-xl border bg-background px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                    >
                      <SelectValue placeholder="Selecione uma categoria" />
                      <ChevronDown class="size-4 text-muted-foreground" />
                    </SelectTrigger>
                    <SelectPortal>
                      <SelectContent
                        position="popper"
                        align="start"
                        :side-offset="4"
                        class="z-[60] min-w-[var(--reka-select-trigger-width)] overflow-hidden rounded-lg border bg-popover p-1 shadow-md"
                      >
                        <SelectItem
                          v-for="category in productCategories"
                          :key="category.id"
                          :value="String(category.id)"
                          class="relative flex cursor-default select-none items-center rounded-md py-1.5 pl-2 pr-8 text-sm outline-none data-[highlighted]:bg-sidebar-accent data-[highlighted]:text-sidebar-accent-foreground"
                        >
                          <SelectItemText>{{ category.nome }}</SelectItemText>
                          <SelectItemIndicator class="absolute right-2 inline-flex items-center justify-center">
                            <Check class="size-4" />
                          </SelectItemIndicator>
                        </SelectItem>
                      </SelectContent>
                    </SelectPortal>
                  </SelectRoot>
                </label>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <label class="block space-y-1.5 text-xs font-medium">
                  Preço unitário (R$) <span class="text-destructive">*</span>
                  <input
                    v-model.number="editDraft.price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    class="h-9 w-full rounded-xl border bg-background px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  >
                  <span class="block text-[11px] font-normal text-muted-foreground">
                    Valor de venda de uma unidade.
                  </span>
                </label>
                <label class="block space-y-1.5 text-xs font-medium">
                  Estoque mínimo <span class="text-destructive">*</span>
                  <input
                    v-model.number="editDraft.minimum"
                    type="number"
                    min="1"
                    step="1"
                    required
                    class="h-9 w-full rounded-xl border bg-background px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  >
                  <span class="block text-[11px] font-normal text-muted-foreground">
                    Quantidade que dispara o alerta de estoque baixo.
                  </span>
                </label>
              </div>

              <p v-if="productError" role="alert" class="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                {{ productError }}
              </p>

              <div class="flex items-start gap-2.5 rounded-xl bg-muted/70 px-3 py-3 text-[11px] leading-relaxed text-muted-foreground">
                <Info class="mt-0.5 size-3.5 shrink-0" />
                <p>
                  A quantidade atual em estoque não é alterada aqui. Registre entradas e saídas em
                  Movimentações para manter o histórico correto.
                </p>
              </div>

              <div class="flex justify-end gap-2 border-t pt-4">
                <Button type="button" variant="outline" @click="isProductDialogOpen = false">
                  Cancelar
                </Button>
                <Button type="submit" :disabled="isSaving">
                  {{ isCreatingProduct ? 'Cadastrar produto' : 'Salvar alterações' }}
                </Button>
              </div>
            </form>

            <template v-else-if="selectedProduct">
              <div class="mt-5 space-y-3 text-xs">
                <div class="flex justify-between gap-4">
                  <span class="text-muted-foreground">Estoque atual</span>
                  <span class="font-medium">{{ selectedProduct.stock }} {{ selectedProduct.unit ?? 'un.' }}</span>
                </div>
                <div class="flex justify-between gap-4">
                  <span class="text-muted-foreground">Estoque mínimo</span>
                  <span class="font-medium">{{ selectedProduct.minimum }} {{ selectedProduct.unit ?? 'un.' }}</span>
                </div>
                <div class="flex justify-between gap-4">
                  <span class="text-muted-foreground">Preço unitário</span>
                  <span class="font-medium">{{ formatCurrency(selectedProduct.price) }}</span>
                </div>
                <div class="flex justify-between gap-4">
                  <span class="text-muted-foreground">Valor em estoque</span>
                  <span class="font-medium">{{ formatCurrency(selectedProduct.price * selectedProduct.stock) }}</span>
                </div>
              </div>

              <div class="mt-4 border-t pt-3">
                <h3 class="text-[10px] font-semibold tracking-wide text-muted-foreground">DESCRIÇÃO</h3>
                <p class="mt-1 text-xs leading-relaxed">{{ selectedProduct.description }}</p>
              </div>

              <div class="mt-5 border-t pt-3">
                <h3 class="flex items-center gap-2 text-[10px] font-semibold tracking-wide text-muted-foreground">
                  <Clock3 class="size-3.5" />
                  ÚLTIMAS MOVIMENTAÇÕES
                </h3>
                <div v-if="selectedProduct.movements?.length" class="mt-2 divide-y">
                  <div
                    v-for="movement in selectedProduct.movements"
                    :key="`${movement.label}-${movement.date}`"
                    class="flex items-center justify-between gap-3 py-2.5"
                  >
                    <div class="min-w-0">
                      <p class="truncate text-xs font-medium">{{ movement.label }}</p>
                      <p class="mt-0.5 text-[10px] text-muted-foreground">
                        {{ movement.date }}
                      </p>
                    </div>
                    <span
                      class="inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-medium"
                      :class="movement.type === 'Entrada'
                        ? 'border-primary/20 bg-primary/10 text-primary'
                        : 'border-red-200 bg-red-50 text-red-700'"
                    >
                      <Plus v-if="movement.type === 'Entrada'" class="size-3" />
                      <Minus v-else class="size-3" />
                      {{ movement.quantity }} {{ selectedProduct.unit ?? 'un.' }} · {{ movement.type }}
                    </span>
                  </div>
                </div>
                <p v-else class="mt-2 text-xs text-muted-foreground">
                  Nenhuma movimentação registrada para este produto.
                </p>
              </div>

              <div class="mt-4 flex justify-end gap-2 border-t pt-3">
                <DialogClose as-child>
                  <Button variant="outline">Fechar</Button>
                </DialogClose>
                <Button @click="startEditingSelectedProduct">
                  <Pencil class="size-4" />
                  Editar produto
                </Button>
              </div>
            </template>
          </template>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </section>
</template>
