import { expect } from 'chai'
import renderMarkdown from './render-markdown.js'

describe('renderMarkdown', () => {
  it('renders Markdown into HTML', async () => {
    const html = await renderMarkdown('*emphasis* and **strong**')
    expect(html).to.equal('<p><em>emphasis</em> and <strong>strong</strong></p>')
  })
})
