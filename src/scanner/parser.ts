const parser = new DOMParser()

export function parseHTML(html: string): Document {
  return parser.parseFromString(html, 'text/html')
}
