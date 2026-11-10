<script setup lang="ts">
import { ref } from 'vue'
import { Bell } from 'lucide-vue-next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface LowStockProduct {
  name: string
  available: number
  minimum: number
}

defineProps<{
  userName: string
  userRole: string
  notifications?: number
  lowStockProducts?: LowStockProduct[]
}>()

const emit = defineEmits<{
  navigate: [section: 'Produtos']
}>()
const showNotifications = ref(false)

const today = new Date().toLocaleDateString('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
</script>

<template>
  <header class="flex items-center justify-between">
    <p class="text-sm text-muted-foreground first-letter:uppercase">{{ today }}</p>

    <div class="flex items-center gap-3">
      <div class="relative">
        <button
          class="relative rounded-full p-2 hover:bg-muted"
          aria-label="Notificações de estoque"
          :aria-expanded="showNotifications"
          @click="showNotifications = !showNotifications"
        >
          <Bell class="size-5" />
          <span
            v-if="notifications"
            class="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-amber-700 text-[10px] font-semibold text-white"
          >
            {{ notifications }}
          </span>
        </button>

        <div
          v-if="showNotifications"
          class="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border bg-white p-3 shadow-lg"
        >
          <p class="px-2 pb-2 text-sm font-semibold">Avisos de estoque</p>
          <p v-if="!lowStockProducts?.length" class="px-2 py-3 text-xs text-muted-foreground">
            Nenhum produto com estoque baixo.
          </p>
          <div v-else class="max-h-60 overflow-y-auto">
            <p
              v-for="product in lowStockProducts"
              :key="product.name"
              class="border-t px-2 py-2 text-xs"
            >
              <span class="block font-medium">{{ product.name }}</span>
              <span class="text-muted-foreground">
                {{ product.available }} disponível · mínimo {{ product.minimum }}
              </span>
            </p>
          </div>
          <button
            v-if="lowStockProducts?.length"
            class="mt-2 w-full rounded-lg bg-muted px-3 py-2 text-xs font-medium hover:bg-muted/70"
            @click="showNotifications = false; emit('navigate', 'Produtos')"
          >
            Ver produtos
          </button>
        </div>
      </div>

      <div class="flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-4 shadow-sm">
        <Avatar class="size-8">
          <AvatarImage src="/perfil-estoque.png" alt="Foto do perfil da equipe Estoque+" />
          <AvatarFallback class="bg-primary text-xs text-primary-foreground">
            {{ userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() }}
          </AvatarFallback>
        </Avatar>
        <div class="leading-tight">
          <p class="text-sm font-semibold">{{ userName }}</p>
          <p class="text-xs text-muted-foreground">{{ userRole }}</p>
        </div>
      </div>
    </div>
  </header>
</template>