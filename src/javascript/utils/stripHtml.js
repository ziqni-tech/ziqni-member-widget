/**
 * Removes HTML tags from the provided input and returns only the text
 * - this is a very basic implementation and should be used carefully
 *
 * @memberOf module:utils
 * @static
 * @param html {string}
 * @returns {string | string}
 */
const stripHtml = function (html) {
  var tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

export default stripHtml;
