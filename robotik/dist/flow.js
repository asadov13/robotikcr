(() => {
  if (!document.body.classList.contains('flow-home')) return;
  document.querySelectorAll('.service-choice').forEach(item => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      document.querySelectorAll('.service-choice').forEach(other => {
        if (other !== item) other.open = false;
      });
    });
  });
})();
