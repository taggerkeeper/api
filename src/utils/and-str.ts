const andStr = (items: string[]): string => {
  if (!Array.isArray(items) || items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`

  const oneLess = items.length - 1
  return `${items.slice(0, oneLess).join(', ')}, and ${items[oneLess]}`
}

export default andStr
