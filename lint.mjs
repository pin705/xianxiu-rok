// Luật oxlint riêng của repo (nạp qua jsPlugins trong .oxlintrc.json).
// ternary-depth: ternary lồng quá 2 tầng (a ? b : c ? d : e ? f : g) khó đọc — dùng bảng tra theo khoá hoặc if / return.
// (no-nested-ternary có sẵn thì cấm mọi lồng nhau, kể cả chuỗi 2 tầng Prettier đã xếp dễ đọc.)
const depth = n => (n?.type === 'ConditionalExpression' ? 1 + Math.max(depth(n.consequent), depth(n.alternate)) : 0)

export default {
  meta: { name: 'rok' },
  rules: {
    'ternary-depth': {
      create(context) {
        return {
          ConditionalExpression(node) {
            if (node.parent?.type === 'ConditionalExpression') return
            const d = depth(node)
            if (d > 2)
              context.report({ node, message: `Ternary lồng ${d} tầng (tối đa 2): dùng bảng tra hoặc if / return` })
          },
        }
      },
    },
  },
}
