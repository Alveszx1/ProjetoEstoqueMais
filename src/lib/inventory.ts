import { ref } from 'vue'
import {
  createMovementFromApi,
  createSaleFromApi,
  getCategoriesFromApi,
  getMovementsFromApi,
  getProductsFromApi,
} from '@/services/estoqueApi'
import type { ApiCategory, ApiMovement, ApiProduct } from '@/services/estoqueApi'

export type MovementType = 'Entrada' | 'Saída'

export interface ProductMovement {
  label: string
  date: string
  quantity: number
  type: MovementType
}

export interface Product {
  id?: number
  categoryId?: number
  name: string
  description: string
  category: string
  price: number
  stock: number
  minimum: number
  unit?: string
  inactive?: boolean
  movements?: ProductMovement[]
}

export interface StockMovement {
  id: number
  product: Product
  type: MovementType
  quantity: number
  reason: string
  date: string
  time: string
}

export interface SaleLine {
  product: Product
  quantity: number
  unitPrice: number
}

export interface SaleRecord {
  id: number
  date: string
  time: string
  items: SaleLine[]
}

export const products = ref<Product[]>([])
export const productCategories = ref<ApiCategory[]>([])
export const stockMovements = ref<StockMovement[]>([])
export const sales = ref<SaleRecord[]>([])
export const inventoryError = ref('')

const formatBackendDate = (value: string) => {
  const date = new Date(value)
  return {
    date: date.toLocaleDateString('pt-BR'),
    time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  }
}

const normalizeProduct = (raw: ApiProduct, categories: ApiCategory[]): Product => ({
  id: Number(raw.id),
  categoryId: Number(raw.id_categoria),
  name: String(raw.nome ?? ''),
  description: String(raw.descricao ?? ''),
  category: String(raw.categoria_nome ?? raw.categoria ?? categories.find(category => Number(category.id) === Number(raw.id_categoria))?.nome ?? 'Geral'),
  price: Number(raw.preco_unitario ?? 0),
  stock: Number(raw.estoque_atual ?? 0),
  minimum: Number(raw.estoque_minimo ?? 0),
  unit: 'un.',
  inactive: raw.is_ativo === false || Number(raw.is_ativo) === 0,
  movements: [],
})

const normalizeMovement = (raw: ApiMovement): StockMovement => {
  const product = products.value.find(item => item.id === Number(raw.id_produto))
  if (!product)
    throw new Error(`Produto ${raw.id_produto} da movimentação não foi carregado.`)

  const { date, time } = formatBackendDate(raw.data_movimentacao)
  const movement = {
    id: Number(raw.id),
    product,
    type: raw.tipo_movimentacao,
    quantity: Number(raw.quantidade),
    reason: raw.observacao ?? (raw.id_venda ? `Venda #${raw.id_venda}` : 'Movimentação de estoque'),
    date,
    time,
  }
  product.movements ??= []
  product.movements.push({
    label: movement.reason,
    date: `${date} · ${time}`,
    quantity: movement.quantity,
    type: movement.type,
  })
  return movement
}

export const reloadProducts = async () => {
  inventoryError.value = ''
  try {
    const [rawProducts, categories] = await Promise.all([
      getProductsFromApi(),
      getCategoriesFromApi(),
    ])
    productCategories.value = categories
    products.value = rawProducts.map(raw => normalizeProduct(raw, categories))
  }
  catch (error) {
    inventoryError.value = error instanceof Error ? error.message : 'Não foi possível carregar os produtos.'
  }
}

export const reloadMovements = async () => {
  inventoryError.value = ''
  try {
    stockMovements.value = (await getMovementsFromApi()).map(normalizeMovement)
  }
  catch (error) {
    inventoryError.value = error instanceof Error ? error.message : 'Não foi possível carregar as movimentações.'
  }
}

export const reloadInventory = async () => {
  await reloadProducts()
  if (!inventoryError.value)
    await reloadMovements()
}

void reloadInventory()

export const recordMovement = async (movement: Omit<StockMovement, 'id'>) => {
  if (!Number.isSafeInteger(movement.quantity) || movement.quantity <= 0)
    throw new Error('Informe uma quantidade inteira maior que zero.')

  if (!movement.product.id)
    throw new Error('Produto sem cadastro válido no backend.')

  const response = await createMovementFromApi({
    id_produto: movement.product.id,
    id_tipo_movimentacao: movement.type === 'Entrada' ? 1 : 2,
    quantidade: movement.quantity,
    observacao: movement.reason,
  })

  if (!response.movimentacao.id)
    throw new Error('A API registrou a movimentação sem retornar o identificador.')
  await reloadInventory()
}

export const recordSale = async (sale: Omit<SaleRecord, 'id'>) => {
  if (!sale.items.length)
    throw new Error('Adicione ao menos um produto à venda.')

  const quantitiesByProduct = new Map<Product, number>()
  for (const item of sale.items) {
    if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0)
      throw new Error('A quantidade de cada produto deve ser um número inteiro maior que zero.')
    quantitiesByProduct.set(item.product, (quantitiesByProduct.get(item.product) ?? 0) + item.quantity)
  }

  const backendSale = await createSaleFromApi({
    itens: [...quantitiesByProduct].map(([product, quantity]) => {
      if (!product.id)
        throw new Error(`Produto sem cadastro válido no backend: ${product.name}`)
      return { id_produto: product.id, quantidade: quantity }
    }),
  })
  const saleId = Number(backendSale.id)
  if (!Number.isSafeInteger(saleId) || saleId < 1)
    throw new Error('A API registrou a venda sem retornar um identificador válido.')
  await reloadInventory()

  const recordedSale: SaleRecord = {
    ...sale,
    id: saleId,
    items: backendSale.itens.map((backendItem) => {
      const product = sale.items.find(item => item.product.id === backendItem.id_produto)?.product
      if (!product)
        throw new Error(`A API retornou um produto desconhecido na venda #${saleId}.`)
      return {
        product,
        quantity: Number(backendItem.quantidade),
        unitPrice: Number(backendItem.preco_unitario),
      }
    }),
  }
  sales.value.unshift(recordedSale)
  return recordedSale
}
