const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:9090/v1/estoque').replace(/\/$/, '')

interface ApiResponse<T> {
  message?: string
  response?: T
}

async function request<T>(path: string, options?: RequestInit): Promise<T>
async function request<T>(path: string, options: RequestInit | undefined, emptyOnNotFound: true): Promise<T | null>
async function request<T>(path: string, options?: RequestInit, emptyOnNotFound = false): Promise<T | null> {
  const response = await fetch(`${API_URL}${path}`, options)
  const data = await response.json() as ApiResponse<T>

  if (response.status === 404 && emptyOnNotFound)
    return null

  if (!response.ok)
    throw new Error(data.message ?? `Erro na API (${response.status}).`)

  if (data.response === undefined)
    throw new Error('A API retornou uma resposta inválida.')

  return data.response
}

export interface ApiProduct {
  id: number | string
  nome: string
  descricao?: string
  categoria?: string
  categoria_nome?: string
  id_categoria?: number | string
  preco_unitario: number | string
  estoque_atual: number | string
  estoque_minimo: number | string
  unidade?: string
  is_ativo?: boolean | number | string
}

export interface DashboardSummary {
  quantidade_produtos: number
  produtos_ativos: number
  unidades_em_estoque: number
  produtos_estoque_baixo: number
  valor_estimado_estoque: number
}

export interface ApiTopProduct {
  nome_produto: string
  quantidade_vendida: number | string
}

export interface ApiMovementDay {
  data: string
  entradas: number | string
  saidas: number | string
}

export interface ApiCategory {
  id: number | string
  nome: string
}

export interface ApiMovement {
  id: number | string
  data_movimentacao: string
  quantidade: number | string
  observacao: string | null
  id_produto: number | string
  nome_produto: string
  id_tipo_movimentacao: 1 | 2
  tipo_movimentacao: 'Entrada' | 'Saída'
  id_venda: number | string | null
}

export interface ApiSaleSummary {
  id: number | string
  data_venda: string
  valor_total: number | string
}

export interface ApiSale {
  id: number | string
  data_venda: string
  valor_total: number | string
  itens: Array<{
    id: number | string
    id_produto: number | string
    nome_produto: string
    quantidade: number | string
    preco_unitario: number | string
  }>
}

export interface CreatedSale {
  id: number
  valor_total: number
  itens: Array<{
    id_produto: number
    quantidade: number
    preco_unitario: number
  }>
}

export interface SalesReport {
  periodo: string
  faturamento: number | string
  itens_vendidos: number | string
  produtos_vendidos: number | string
  produtos: Array<{
    id_produto: number | string
    produto: string
    quantidade: number | string
    total_vendido: number | string
  }>
}

export interface ProductPayload {
  nome: string
  descricao: string
  preco_unitario: number
  estoque_minimo: number
  id_categoria: number
}

export async function getProductsFromApi() {
  const response = await request<{ produtos: ApiProduct[] }>('/produto', undefined, true)
  return response?.produtos ?? []
}

export async function getCategoriesFromApi() {
  const response = await request<{ funcionario: ApiCategory[] }>('/categoria', undefined, true)
  return response?.funcionario ?? []
}

export async function createProductFromApi(payload: ProductPayload) {
  return request<ApiProduct>('/produto', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function updateProductFromApi(id: number, payload: ProductPayload) {
  return request<{ produto: ApiProduct }>(`/produto/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function setProductActiveFromApi(id: number, isActive: boolean) {
  return request<{ produto: { id: number, is_ativo: boolean } }>(`/produto/${id}/ativo`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_ativo: isActive }),
  })
}

export async function getMovementsFromApi() {
  const response = await request<{ movimentacoes: ApiMovement[] }>('/movimentacoes', undefined, true)
  return response?.movimentacoes ?? []
}

export async function getSalesFromApi(startDate: string, endDate: string) {
  const params = new URLSearchParams({ data_inicio: startDate, data_fim: endDate })
  const response = await request<{ vendas: ApiSaleSummary[] }>(`/vendas?${params}`, undefined, true)
  return response?.vendas ?? []
}

export async function getSaleFromApi(id: number) {
  const response = await request<{ venda: ApiSale }>(`/vendas/${id}`)
  return response.venda
}

export async function getSalesReportFromApi(startDate: string, endDate: string) {
  const params = new URLSearchParams({ data_inicio: startDate, data_fim: endDate })
  const response = await request<{ relatorio: SalesReport }>(`/vendas/relatorio?${params}`)
  return response.relatorio
}

export async function getDashboardSummaryFromApi() {
  const response = await request<{ resumo: DashboardSummary }>('/dashboard/resumo')
  return response.resumo
}

export async function getTopProductsFromApi() {
  const response = await request<{ produtos: ApiTopProduct[] }>('/dashboard/mais-vendidos')
  return response.produtos
}

export async function getMovementSummaryFromApi() {
  const response = await request<{ resumo: { movimentacoes_por_dia: ApiMovementDay[] } }>('/dashboard/movimentos')
  return response.resumo
}

export async function createMovementFromApi(payload: {
  id_produto: number
  id_tipo_movimentacao: 1 | 2
  quantidade: number
  observacao?: string | null
}) {
  return request<{ movimentacao: { id: number } }>('/movimentacoes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function createSaleFromApi(payload: {
  itens: Array<{
    id_produto: number
    quantidade: number
  }>
}) {
  const response = await request<{ venda: CreatedSale }>('/vendas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return response.venda
}
