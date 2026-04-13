---
id: 7
title: BigQuery Cost
badge: P1-快赢
badge-class: p1
status: 未明确
status-class: tbd
subtitle: 子集 SQL 测试 + INFORMATION_SCHEMA 分析 — Quick Win 展示成本改善
---

## 基本信息
| 架构图位置 | BigQuery Data Warehouse |
| 架构图标注 | ⚠️ Goal: Cost Reduction and Efficiency Improvement |
| 上下游关系 | **上游:** Dataflow Pipeline 写入 → GKE 计算结果写入<br>**下游:** 终端用户查询/报表/BI |
| Impact | 资源 over-provisioning 或低效查询推高运行成本；影响迁移后的 TCO 优势，削弱业务部门对新平台的信心 |
| 假设归属 | H1: 技术与基建（架构效率层面） |
| 怀疑方向 | BigQuery 使用方式未优化——可能存在全表扫描、未分区/聚簇、slot over-provisioning，导致成本高于必要水平 |

## Sub-Hypotheses {hyp}

### BQ-a — 查询效率低
业务查询未优化，存在大量 full table scan、缺少分区剪裁
✅ | INFORMATION_SCHEMA.JOBS 显示 top queries 扫描字节数远超返回字节数（ratio > 100:1）；分区表但查询未利用分区键过滤 | → A1,4<br>→ A6
❌ | Top queries 扫描效率合理（有分区剪裁和列过滤）→ 查询不是成本问题 | → A1,4<br>→ A6

### BQ-b — 表设计未优化
缺少分区和聚簇配置，或分区键选择不当
✅ | 高频查询的目标表未分区或分区键与查询过滤字段不匹配；聚簇未配置在高基数过滤列上 | → A2,4
❌ | 分区/聚簇配置合理且查询命中 → 表设计不是问题 | → A2,4

### BQ-c — Slot over-provisioning
购买了过多的 flat-rate slot 或 edition commitment，实际利用率低
✅ | Slot utilization 持续 <30%；或使用 on-demand pricing 但高频查询可预测（应切 flat-rate） | → A3,4<br>→ A5,6
❌ | Slot 利用率在 60-80% 的健康范围 → 计费模式合理 | → A3,4<br>→ A5,6

## Discovery — Technical Actions {disc}
| Action 1 | INFORMATION_SCHEMA.JOBS 分析 — 查 top 20 最贵查询（by bytes scanned & slot time）；识别 full table scan 和低效 join | ← BQ-a
| Action 2 | 分区/聚簇审查 — 检查所有核心表的分区键和聚簇列配置；对比高频查询的 WHERE 条件 | ← BQ-b
| Action 3 | Slot Utilization 分析 — Cloud Monitoring 查看 slot 使用率趋势；识别峰值和低谷 | ← BQ-c
| Action 4 | 成本拆分 — 按 project/dataset/user 维度拆分 BigQuery 成本，找出最大开销来源 | ← BQ-a,b,c

## Discovery — Process Actions {disc}
| Action 5 | 确认成本管理责任人 — 谁在看 BigQuery 成本？有无 FinOps 流程？有无预算警报？ | ← BQ-c
| Action 6 | 了解业务查询模式 — 与 BI/数据团队沟通，理解主要查询场景和频率，判断 on-demand vs flat-rate 哪个更合适 | ← BQ-a,c

## Discovery 产出物 {disc}
| 产出物 | BigQuery Cost Optimization Assessment — 包含：top costly queries 列表、分区/聚簇优化建议、slot sizing 建议、预估优化后成本节省比例 |

## 执行计划 {exec}
| Phase 2 (Week 4-7) | 优化 top queries（加分区剪裁、重写低效 join）；调整表分区/聚簇策略 |
| Phase 3 (Week 8-12) | 调整 slot commitment / 切换计费模式；建立成本 dashboard 和预算警报；数据入 steady-state 后做最终 right-sizing |

## RACI {raci}
| R — Responsible | Outcome CE（优化建议）+ Customer Data Team（执行查询和表优化） |
| A — Accountable | Head of Cloud Delivery（成本目标） |
| C — Consulted | Google TAM（BigQuery pricing 建议）、BI 团队（查询模式） |
| I — Informed | VP of Operations（成本报告） |

## 风险与成功标准 {risk}
| 成功标准 | BigQuery 月度成本下降 ≥30%（优化后 vs 优化前）；无 full table scan 查询；slot 利用率 60-80% |
| 风险 | 优化查询可能影响现有报表的运行时间或结果 |
| 风险缓解 | 优化前先在 staging 环境验证；保留原始查询版本可回滚 |
| Blocker 依赖 | 依赖 #5（Pipeline）修复——Pipeline 写入 BigQuery 的方式（batch size、write disposition）直接影响存储和查询效率 |
