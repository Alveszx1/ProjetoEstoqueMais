<script setup lang="ts">
import { computed } from 'vue'
import { VisAxis, VisGroupedBar, VisXYContainer } from '@unovis/vue'
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  ChartContainer,
  ChartCrosshair,
  ChartTooltip,
  ChartTooltipContent,
  componentToString,
  type ChartConfig,
} from '@/components/ui/chart'

export interface MovementPoint {
  label: string
  entradas: number
  saidas: number
}

const props = defineProps<{ data: MovementPoint[] }>()

const chartConfig = {
  entradas: { label: 'Entradas', color: 'var(--chart-1)' },
  saidas: { label: 'Saídas', color: 'var(--chart-2)' },
} satisfies ChartConfig

const totalEntradas = computed(() => props.data.reduce((soma, d) => soma + d.entradas, 0))
const totalSaidas = computed(() => props.data.reduce((soma, d) => soma + d.saidas, 0))

// Topo do eixo Y: múltiplo de 4, mínimo 4
const yMax = computed(() => {
  const maior = Math.max(...props.data.flatMap((d) => [d.entradas, d.saidas]), 0)
  return Math.max(Math.ceil(maior / 4) * 4, 4)
})

const tooltipTemplate = componentToString(chartConfig, ChartTooltipContent, {
  labelFormatter: (x: number | Date) =>
    typeof x === 'number' ? props.data[x]?.label ?? '' : x.toLocaleDateString('pt-BR'),
})
</script>

<template>
  <Card class="rounded-2xl py-0 shadow-sm">
    <CardHeader class="flex flex-row items-start justify-between gap-4 p-6 pb-2">
      <div>
        <CardTitle class="text-base">Entradas e saídas por período</CardTitle>
        <CardDescription>Quantidades movimentadas nos últimos 14 dias</CardDescription>
      </div>
      <div class="flex gap-6">
        <div class="text-right">
          <p class="text-[11px] font-medium tracking-widest text-muted-foreground">ENTRADAS</p>
          <p class="text-2xl font-bold">{{ totalEntradas }}</p>
        </div>
        <div class="text-right">
          <p class="text-[11px] font-medium tracking-widest text-muted-foreground">SAÍDAS</p>
          <p class="text-2xl font-bold">{{ totalSaidas }}</p>
        </div>
      </div>
    </CardHeader>

    <CardContent class="p-6 pt-4">
      <ChartContainer :config="chartConfig" class="aspect-auto h-64 w-full" cursor>
        <VisXYContainer :data="data" :y-domain="[0, yMax]" :margin="{ left: 0, right: 0 }">
          <VisGroupedBar
            :x="(_: MovementPoint, i: number) => i"
            :y="[(d: MovementPoint) => d.entradas, (d: MovementPoint) => d.saidas]"
            :color="[chartConfig.entradas.color, chartConfig.saidas.color]"
            :rounded-corners="4"
            :group-padding="0.25"
            :bar-padding="0.1"
          />

          <VisAxis
            type="x"
            :num-ticks="data.length"
            :tick-format="(i: number) => data[i]?.label ?? ''"
            :grid-line="false"
            :tick-line="false"
            :domain-line="false"
          />
          <VisAxis
            type="y"
            :num-ticks="4"
            :tick-line="false"
            :domain-line="false"
          />

          <ChartTooltip />
          <ChartCrosshair
            :template="tooltipTemplate"
            :color="[chartConfig.entradas.color, chartConfig.saidas.color]"
          />
        </VisXYContainer>
      </ChartContainer>
    </CardContent>
  </Card>
</template>