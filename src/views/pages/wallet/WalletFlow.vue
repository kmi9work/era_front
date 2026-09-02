<script setup>
import { ref } from 'vue'
import WalletMobile from './WalletMobile.vue'
import TransferRecipientMobile from './TransferRecipientMobile.vue'
import TransferBasketMobile from './TransferBasketMobile.vue'
import TransferConfirmMobile from './TransferConfirmMobile.vue'

defineProps({
  player: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['back'])

const currentScreen = ref('wallet') // 'wallet', 'recipient', 'basket', 'confirm'
const recipient = ref(null)
const basket = ref([])

const walletMobileRef = ref(null)

const goToTransfer = () => {
  currentScreen.value = 'recipient'
}

const recipientSelected = (selected) => {
  recipient.value = selected
  currentScreen.value = 'basket'
}

const basketReady = (selectedBasket) => {
  basket.value = selectedBasket
  currentScreen.value = 'confirm'
}

const backToWallet = () => {
  currentScreen.value = 'wallet'
  recipient.value = null
  basket.value = []
  walletMobileRef.value?.refresh()
}

const backToRecipient = () => {
  currentScreen.value = 'recipient'
}

const backToBasket = () => {
  currentScreen.value = 'basket'
}

// Универсальная функция "Назад" для кнопки телефона (вызывается родителем MobileHelper)
const handleBack = () => {
  if (currentScreen.value === 'confirm') {
    backToBasket()
  } else if (currentScreen.value === 'basket') {
    backToRecipient()
  } else if (currentScreen.value === 'recipient') {
    backToWallet()
  } else {
    emit('back')
  }
}

defineExpose({
  handleBack
})
</script>

<template>
  <div>
    <WalletMobile
      v-if="currentScreen === 'wallet'"
      ref="walletMobileRef"
      :player="player"
      @back="handleBack"
      @transfer="goToTransfer"
    />
    <TransferRecipientMobile
      v-if="currentScreen === 'recipient'"
      :player="player"
      @back="backToWallet"
      @selected="recipientSelected"
    />
    <TransferBasketMobile
      v-if="currentScreen === 'basket'"
      :player="player"
      @back="backToRecipient"
      @next="basketReady"
    />
    <TransferConfirmMobile
      v-if="currentScreen === 'confirm' && recipient"
      :player="player"
      :recipient="recipient"
      :basket="basket"
      @back="backToBasket"
      @done="backToWallet"
    />
  </div>
</template>
