type ObserveCallback = (entry: IntersectionObserverEntry) => void

export const useIntersectionObserver = (
  callback: ObserveCallback,
  options: IntersectionObserverInit = { threshold: 0.33 }
) => {
  const observer = ref<IntersectionObserver | null>(null)
  onMounted(() => {
    observer.value = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          callback(entry)
          observer.value?.unobserve(entry.target)
        }
      }
    }, options)
  })
  onBeforeUnmount(() => {
    if (observer.value) {
      observer.value.disconnect()
      observer.value = null
    }
  })

  function observeElement(el: Element | null) {
    if (!el || !observer.value) return
    observer.value.observe(el)
  }

  return { observeElement }
}
