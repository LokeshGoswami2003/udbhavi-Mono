const navigationEvent = 'udbhavi:navigation'

export function navigateTo(path) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new Event(navigationEvent))
}

export function replaceWith(path) {
  window.history.replaceState({}, document.title, path)
  window.dispatchEvent(new Event(navigationEvent))
}

export function subscribeToNavigation(callback) {
  window.addEventListener('popstate', callback)
  window.addEventListener(navigationEvent, callback)

  return () => {
    window.removeEventListener('popstate', callback)
    window.removeEventListener(navigationEvent, callback)
  }
}
