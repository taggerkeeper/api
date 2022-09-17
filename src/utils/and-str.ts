const andStr = (items: string[], conjunction: string = 'and'): string => {
  if (!Array.isArray(items) || items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`

  const oneLess = items.length - 1
  return `${items.slice(0, oneLess).join(', ')}, ${conjunction} ${items[oneLess]}`
}

export default andStr
