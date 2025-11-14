export function createElementWithClass (tag, className, content = '') {
  const element = document.createElement(tag);
  element.setAttribute('class', className);
  if (content) {
    element.innerHTML = content;
  }
  return element;
}
