import { expect } from 'chai'
import renderMarkdown from './render-markdown.js'

describe('renderMarkdown', () => {
  it('renders Markdown into HTML', async () => {
    const html = await renderMarkdown('*emphasis* and **strong**')
    expect(html).to.equal('<p><em>emphasis</em> and <strong>strong</strong></p>')
  })

  it('allows basic HTML', async () => {
    const html = await renderMarkdown('<span class="test">This is a test.</span>')
    expect(html).to.equal('<p><span class="test">This is a test.</span></p>')
  })

  it('sanitizes dangerous HTML', async () => {
    const html = await renderMarkdown('<script>This is a test.</script>')
    expect(html).to.equal('')
  })

  it('allows divs', async () => {
    const html = await renderMarkdown('<div class="test">This is a test.</div>')
    expect(html).to.equal('<div class="test">This is a test.</div>')
  })

  it('allows blockquotes', async () => {
    const html = await renderMarkdown('<blockquote>This is a test.</blockquote>')
    expect(html).to.equal('<blockquote>This is a test.</blockquote>')
  })

  it('allows figures', async () => {
    const html = await renderMarkdown('<figure><figcaption>This is a test.</figcaption></figure>')
    expect(html).to.equal('<figure><figcaption>This is a test.</figcaption></figure>')
  })

  it('allows asides', async () => {
    const html = await renderMarkdown('<aside>This is a test.</aside>')
    expect(html).to.equal('<aside>This is a test.</aside>')
  })

  it('allows sections', async () => {
    const html = await renderMarkdown('<section>This is a test.</section>')
    expect(html).to.equal('<section>This is a test.</section>')
  })

  it('allows headers', async () => {
    const html = await renderMarkdown('<header>This is a test.</header>')
    expect(html).to.equal('<header>This is a test.</header>')
  })

  it('allows footers', async () => {
    const html = await renderMarkdown('<footer>This is a test.</footer>')
    expect(html).to.equal('<footer>This is a test.</footer>')
  })

  it('adds ID\'s to headings', async () => {
    const html = await renderMarkdown('## Test Heading\n\nHello, world!')
    expect(html).to.equal('<h2 id="test-heading">Test Heading</h2>\n<p>Hello, world!</p>')
  })
})
