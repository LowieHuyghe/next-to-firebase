import { expect } from 'chai'
import {
  filterEmpty,
  fillTemplate
} from './helpers'

describe('helpers', () => {
  it('filterEmpty', () => {
    expect(filterEmpty(true)).to.equal(true)
    expect(filterEmpty(false)).to.equal(false)

    expect(filterEmpty('')).to.equal(false)
    expect(filterEmpty('i')).to.equal(true)

    expect(filterEmpty(0)).to.equal(false)
    expect(filterEmpty(1)).to.equal(true)

    expect(filterEmpty(undefined)).to.equal(false)
    expect(filterEmpty(null)).to.equal(false)
    expect(filterEmpty({})).to.equal(true)
  })

  it('fillTemplate', () => {
    const template = `{
  "hosting": {
    "rewrites": [
      { source: "/page", destination: "page.html" },
      "_rewrites_"
    ]
  }
}`
    const data = `{ source: "/", destination: "index.html" },
{ source: "**/**", function: "_error" }`

    const result = fillTemplate(template, '"_rewrites_"', data)

    expect(result).to.equal(`{
  "hosting": {
    "rewrites": [
      { source: "/page", destination: "page.html" },
      { source: "/", destination: "index.html" },
      { source: "**/**", function: "_error" }
    ]
  }
}`)
  })
})
