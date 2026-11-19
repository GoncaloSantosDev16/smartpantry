import { onBeforeUnmount, onMounted, ref } from 'vue'

// US-16 / SCRUM-101: estado da ligação à internet.
// Reage aos eventos "online" e "offline" do browser (e aos que os testes disparem).
export function useOnlineStatus() {
  const online = ref(typeof navigator === 'undefined' ? true : navigator.onLine !== false)

  const goOnline = () => {
    online.value = true
  }
  const goOffline = () => {
    online.value = false
  }

  onMounted(() => {
    online.value = navigator.onLine !== false
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('online', goOnline)
    window.removeEventListener('offline', goOffline)
  })

  return { online }
}
