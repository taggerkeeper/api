import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeStringify)

const renderMarkdown = async (markdown: string): Promise<string> => {
  const markup = await processor.process(markdown)
  return markup.toString()
}

export default renderMarkdown
