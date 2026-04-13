/* ============================================================
 * gantt-data.js — Gantt 图配置文件（MD 格式）
 * 编辑下方 MD 文本即可更新页面 Gantt 渲染。
 * 新增一行任务 → 刷新页面自动多出一个方框。
 * ============================================================ */

var GANTT_10G_MD = `
---
id: gantt-10g
weeks: 12
cutover: W12
description: 所有 Blocker Day 1 同时启动，互不等待；但 Go-Live 需要**全部就绪**后才能触发。行序与严重等级排序一致。
sort-note: 排序：与严重等级一致（#3→#1→#6→#5→#7→#8→#4→#2）— 最紧急的在最上方，便于识别整体压缩空间和资源投入优先级。
---

## #3 Security Review | P0-长线 | #dc2626 | blocker3.html
- W1~W3   | act  | 提交材料
- W3~W9   | ext  | 审批等待（不可压缩）
- W9~W10  | blk  | 等 #2 | wait:2
- W10~W12 | act  | 审批通过
- W12~    | done | 就绪

## #1 Interconnect | P0-长线 | #d97706 | blocker1.html
- W1~W2   | act  | 诊断
- W2~W4   | ext  | 运营商+扩容
- W4~W10  | crit | 2PB 传输 ~4w | dep-source
- W10~W12 | act  | 验收
- W12~    | done | 就绪

## #6 Region Resources | P0-触发 | #0891b2 | blocker6.html
- W1~W2   | act  | Quota 诊断
- W2~W3   | act  | 提交
- W3~W5   | act  | 子集验证
- W5~W7   | ext  | Quota 审批
- W7~W9   | act  | 扩容
- W9~W10  | blk  | 等 #1 | wait:1
- W10~W12 | act  | 全量验证
- W12~    | done | 就绪

## #5 Pipeline Latency | P0-短线 | #2563eb | blocker5.html
- W1~W2   | act  | profiling
- W2~W5   | act  | 子集修复调优
- W5~W10  | blk  | 等 #1 数据到位 | wait:1
- W10~W12 | act  | 全量验证
- W12~    | done | 就绪

## #7 BigQuery Cost | P1-快赢 | #059669 | blocker7.html
- W1~W3   | act  | SQL 诊断
- W3~W6   | act  | 子集优化
- W6~W10  | blk  | 等 #1 全量数据 | wait:1
- W10~W12 | act  | 全量验证
- W12~    | done | 就绪

## #8 User Adoption | P1-后台 | #64748b | blocker8.html
- W1~W4   | act  | Baseline 收集
- W4~W8   | act  | 访谈 + Gap 分析
- W8~W12  | act  | 采用加速执行
- W12~    | done | 就绪

## #4 DBA Engagement | P1-协调 | #7c3aed | blocker4.html
- W1~W2   | act  | Schema
- W2~W4   | act  | VP 协调
- W4~W8   | act  | 子集验证
- W8~W10  | blk  | 等 #1 | wait:1
- W10~W12 | act  | 全量验证
- W12~    | done | 就绪

## #2 Security Controls | P1-短线 | #be185d | blocker2.html
- W1~W2   | act  | Gap 扫描
- W2~W4   | act  | 安全对接
- W4~W6   | act  | 配置修复
- W6~W10  | crit | 提交材料 → #3 | dep-source | feed:3
- W10~W12 | act  | 验收
- W12~    | done | 就绪
`;

var GANTT_40G_MD = `
---
id: gantt-40g
weeks: 12
cutover: W9
cutover-init: W9
description: 假设带宽从 10Gbps 升级至 40Gbps，2PB 传输从 ~4 周压缩至 ~1 周。下游等待窗口大幅缩短或消除，整体割接从 W12 提前至 **W9**。
sort-note: 对比：同一项目仅改变带宽假设（10G → 40G），其余资源和工作项完全不变。拖拽验证约束传播后的压缩效果。
---

## #3 Security Review | P0-长线 | #dc2626 | blocker3.html
- W1~W2   | act  | 提交材料
- W2~W7   | ext  | 审批等待（不可压缩）
- W7~W8   | blk  | 等 #2 | wait:2
- W8~W9   | act  | 审批通过
- W9~W10  | done | 就绪

## #1 Interconnect | P0-长线 | #d97706 | blocker1.html
- W1~W2   | act  | 诊断
- W2~W4   | act  | 40G 扩容
- W4~W7   | crit | 2PB 传输 ~1w | dep-source
- W7~W9   | act  | 验收
- W9~W10  | done | 就绪

## #6 Region Resources | P0-触发 | #0891b2 | blocker6.html
- W1~W2   | act  | Quota 诊断
- W2~W3   | act  | 提交
- W3~W5   | ext  | Quota 审批
- W5~W6   | act  | 扩容
- W6~W7   | blk  | 等 #1 | wait:1
- W7~W9   | act  | 全量验证
- W9~W10  | done | 就绪

## #5 Pipeline Latency | P0-短线 | #2563eb | blocker5.html
- W1~W2   | act  | profiling
- W2~W5   | act  | 子集修复调优
- W5~W7   | blk  | 等 #1 数据到位 | wait:1
- W7~W9   | act  | 全量验证
- W9~W10  | done | 就绪

## #7 BigQuery Cost | P1-快赢 | #059669 | blocker7.html
- W1~W3   | act  | SQL 诊断
- W3~W6   | act  | 子集优化
- W6~W7   | blk  | 等 #1 | wait:1
- W7~W9   | act  | 全量验证
- W9~W10  | done | 就绪

## #8 User Adoption | P1-后台 | #64748b | blocker8.html
- W1~W3   | act  | Baseline 收集
- W3~W6   | act  | 访谈 + Gap 分析
- W6~W9   | act  | 采用加速执行
- W9~W10  | done | 就绪

## #4 DBA Engagement | P1-协调 | #7c3aed | blocker4.html
- W1~W2   | act  | Schema
- W2~W3   | act  | VP 协调
- W3~W7   | act  | 子集验证
- W7~W9   | act  | 全量验证
- W9~W10  | done | 就绪

## #2 Security Controls | P1-短线 | #be185d | blocker2.html
- W1~W2   | act  | Gap 扫描
- W2~W4   | act  | 安全对接
- W4~W6   | act  | 配置修复
- W6~W8   | crit | 提交材料 → #3 | dep-source | feed:3
- W8~W9   | act  | 验收
- W9~     | done | 就绪
`;
