// Part of the code were gotten from this repo
// https://github.com/pborenstein/eleventy-md-syntax-highlight
const Prism = require("prismjs")
const PrismLoader = require("@11ty/eleventy-plugin-syntaxhighlight/src/PrismLoader")
const HighlightLinesGroup = require("@11ty/eleventy-plugin-syntaxhighlight/src/HighlightLinesGroup")
/**
 *
 *  The parts of fences:
 *  ```
 *
 *  ```lang#
 *  turns line numbers on
 *  ```
 *
 *  ```lang#[17]
 *  turn line numbers on
 *  start numbering at 17
 *  ```
 */

function syntaxHighlighterNum(options = {}) {
  let plugin = function (fenceBody, fenceText) {
    //  if there's nothing after the
    //  three backquotes, let the
    //  markdown processor handle the fence

    if (!fenceText) {
      return ""
    }

    //  split the fenceText into
    //  the three parts

    let [language = "", fenceMark = "", fenceOptions = ""] = fenceText.split(
      /\s*(#|\/)\s*/,
    )
    let numberingStart = 1
    if (fenceOptions[0] == "[") {
      let [numberOptions, highlightOptions] = fenceOptions.slice(1).split("]")
      numberingStart = isNaN(parseInt(numberOptions, 10))
        ? 1
        : parseInt(numberOptions, 10)
      fenceText = language + highlightOptions
    } else {
      fenceText = fenceText.replace("#", "")
    }

    let html = fenceBody
    if (language !== "text") {
      html = Prism.highlight(fenceBody, PrismLoader(language), language)
    }

    //  Prism's markdown highlighter renders tables
    //  with a newline before the end of the corresponding
    //  markdown line. It's hacky, but I'd rather
    //  fix it up here than figure out how to
    //  fix Prism's markdown highlighter

    if (language === "markdown") {
      html = html.replace(/<\/span>\n<\/span>/g, "</span></span>\n")
      html = html.replace(/\n<\/span>$/, "</span>")
    }

    //  Count the number of newlines
    //  as defined by NEWLINE_EXP
    //  borrowing from https://github.com/PrismJS/prism/blob/e523f5d0b74044e487001964cc8b4df635f7e9de/plugins/line-numbers/prism-line-numbers.js#L112-L113

    const NEWLINE_EXP = /\n(?!$)/g

    let matches = html.match(NEWLINE_EXP)
    let numberOfLines = matches ? matches.length + 1 : 1

    let lineNumbersHTML = ""
    let lineNumbersClass = ""
    let split = fenceText.split("/")

    if (options.showLineNumbers || fenceMark === "#") {
      lineNumbersClass = "line-numbers"
      lineNumbersHTML =
        '<span aria-hidden="true" class="line-numbers-rows">' +
        new Array(numberOfLines + 1).join("<span></span>") +
        "</span>"
    }
    let hasHighlightNumbers = split.length > 0
    let highlights = new HighlightLinesGroup(split.join("/"), "/")
    let lines = html.split("\n").slice(0, -1) // The last line is empty.

    lines = lines.map(function (line, j) {
      if (options.alwaysWrapLineHighlights || hasHighlightNumbers) {
        let lineContent = highlights.getLineMarkup(j, line)
        return lineContent
      }
      return line
    })
    numberingStart-- //  css increments the counter
    //  before it paints the number
    //  so we take a step back

    let retStr =
      `<pre class="language-${language} ${lineNumbersClass}" style="counter-reset: linenumber ${numberingStart}">` +
      `<code class="language-${language}">` +
      `${lines.join(options.lineSeparator || "<br>")}  ${lineNumbersHTML} ` +
      `</code></pre>`
    return retStr
  }
  return plugin
}

module.exports = function (eleventyConfig, options = {}) {
  options = Object.assign(
    { showLineNumbers: false, alwaysWrapLineHighlights: false },
    options,
  )
  //  this is where the plugin code gets hooked up
  //  in the default md's highlighter
  eleventyConfig.addMarkdownHighlighter(syntaxHighlighterNum(options))
}
