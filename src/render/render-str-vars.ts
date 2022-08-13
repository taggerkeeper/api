const renderStrVars = (template: string, data: any): string => {
  let rendered = template
  const keys = Object.keys(data)
  keys.forEach(key => {
    const regex = new RegExp(`\\[${key.toUpperCase()}\\]`, 'g')
    rendered = rendered.replace(regex, data[key])
  })
  return rendered
}

export default renderStrVars
