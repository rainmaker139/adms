import assert from 'node:assert/strict'
import { readdir, readFile, stat } from 'node:fs/promises'
import ts from 'typescript'

const dist = new URL('../dist/', import.meta.url)
assert.deepEqual(await readdir(dist), ['adms-demo.html'], 'dist에는 adms-demo.html 하나만 있어야 합니다.')
const file = new URL('adms-demo.html', dist)
const html = await readFile(file, 'utf8')
assert.match(html, /<script\b[^>]*>[\s\S]+?<\/script>/i, '인라인 JavaScript 필요')
assert.match(html, /<style\b[^>]*>[\s\S]+?<\/style>/i, '인라인 CSS 필요')
// 번들 문자열에 포함된 SVG namespace/라이브러리 문서 URL은 요청이 아니다.
// 실제 HTML 리소스 태그와 CSS 로딩 구문을 검사한다.
const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (script) => script.slice(0, script.indexOf('>') + 1) + '</script>')
for (const tag of markup.matchAll(/<(?:script|link|img|image|use|source|video|audio|iframe|object|embed)\b[^>]*>/gi)) {
  for (const attr of tag[0].matchAll(/\b(?:src|href|xlink:href|poster|data)\s*=\s*["']([^"']*)["']/gi)) {
    assert.ok(/^(?:data:|#|$)/i.test(attr[1]), `외부/별도 리소스 발견: ${attr[1]}`)
  }
  assert.doesNotMatch(tag[0], /\bsrcset\s*=/i, 'srcset 별도 검증 필요')
}
for (const style of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
  assert.doesNotMatch(style[1], /@import\b/i, 'CSS import 금지')
  for (const url of style[1].matchAll(/url\(\s*["']?([^"')\s]+)/gi)) {
    assert.ok(/^(?:data:|#)/i.test(url[1]), `CSS 외부 리소스 발견: ${url[1]}`)
  }
}
let libraryDynamicLoaders = 0
for (const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
  const ast = ts.createSourceFile('bundle.js', script[1], ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
  const inspect = (node) => {
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      assert.ok(!ts.isStringLiteralLike(node.arguments[0]), '별도 번들 동적 import 금지')
      libraryDynamicLoaders += 1
    }
    assert.ok(!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node), '외부 모듈 참조 금지')
    ts.forEachChild(node, inspect)
  }
  inspect(ast)
}
console.log(`단일 HTML 검사 통과: ${(await stat(file)).size.toLocaleString()} bytes, 외부 HTML/CSS 리소스 및 별도 번들 import 없음`)
if (libraryDynamicLoaders) console.log(`라이브러리 내부 비정적 로더 ${libraryDynamicLoaders}개: HashRouter에서는 사용하지 않음. 오프라인 브라우저 검증으로 실제 요청 확인 필요.`)
