import deepmerge from 'deepmerge'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'

const schema = deepmerge(defaultSchema, {
  tagNames: ['header', 'section', 'aside', 'footer'],
  attributes: { '*': ['className'] }
})

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeSanitize, schema)
  .use(rehypeSlug)
  .use(rehypeStringify)

const renderMarkdown = async (markdown: string): Promise<string> => {
  const markup = await processor.process(markdown)
  return markup.toString()
}

export default renderMarkdown
