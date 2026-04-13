---
id: 4
title: DBA Team Not Yet Engaged
badge: P1-协调
badge-class: p1
status: Stalled
status-class: stalled
subtitle: Day 1 启动 schema 审查 + 自动化脚本，同步触发 VP 协调
---

## 基本信息
| 架构图位置 | On-Prem Source → Legacy Database |
| 架构图标注 | ⚠️ DBA Team Unavailable |
| 上下游关系 | **上游:** 2PB Raw Data Source of Truth<br>**下游:** Cloud Storage → Dataflow → BigQuery（数据最终要完整迁移到 BigQuery） |
| Impact | 数据验证无法推进——schema 映射、数据完整性校验、迁移后一致性确认都依赖 DBA |
| 假设归属 | H2: 组织与流程 |
| 怀疑方向 | 不是技术问题，是人员调配问题——DBA 团队要么被其他项目占用，要么不知道需要他们参与，要么汇报线不同导致优先级错位 |

## Sub-Hypotheses {hyp}

### 4a — 被其他项目占用
有人但没空，需要管理层重新排优先级
✅ | DBA lead 确认团队当前 100% 分配在其他项目；无法在 2 周内释放任何人力 | → A1,2,3,4<br>→ A6,7,8,9
❌ | DBA 团队有空闲人力但未被通知到此项目 → 是协调问题，不是产能问题 | → A1,2,3,4<br>→ A6,7,8,9
→ | 检查 Sub-Hypothesis 4b |

### 4b — 不知道需要参与
信息断层，项目交接时未纳入 DBA
✅ | DBA lead 表示从未收到参与请求；不了解此项目的存在或时间线 | → A1,2,4<br>→ A6
❌ | DBA 已知晓项目但因其他原因未参与 | → A1,2,4<br>→ A6
→ | 检查 Sub-Hypothesis 4c |

### 4c — 汇报线冲突
DBA 团队不向 Head of Cloud Delivery 汇报，其直属经理有不同的优先级
✅ | DBA 团队归属不同部门；其经理确认此项目不在他们的 OKR 中 | → A1,2,4<br>→ A5,8
❌ | DBA 团队与项目在同一汇报线下 → 不是汇报线问题 | → A1,2,4<br>→ A5,8
→ | 可能是技能问题——DBA 团队有人但不具备 BigQuery/Cloud SQL 经验 |

## Discovery — Technical Actions {disc}
| Action 1 | 数据 Schema 文档审查 — Legacy DB 的 schema 文档是否完整？是否有 ERD（实体关系图）？有多少张表、多少字段需要映射？ | ← 4a,4b,4c
| Action 2 | Legacy DB → BigQuery 数据映射检查 — 迁移的目标 schema 是否已定义？数据类型转换规则是否已明确？ | ← 4a,4b,4c
| Action 3 | 自动化验证脚本评估 — 能否编写自动化脚本做基础的行数对比、字段校验、checksum 校验，降低对 DBA 人工校验的依赖？ | ← 4a
| Action 4 | 数据质量 Baseline — 源数据本身是否有质量问题（null 值、格式不一致、重复记录）？这些问题需在迁移前还是迁移后处理？ | ← 4a,4b,4c

## Discovery — Process Actions {disc}
| Action 5 | 确认 DBA 团队汇报线 — DBA 向谁汇报？是否在 Head of Cloud Delivery 管辖范围内？如果不是，谁有权调配？ | ← 4c
| Action 6 | 与 DBA Lead 面谈 — 团队当前负载？能否释放 part-time 人力？需要什么级别的管理层授权？ | ← 4a,4b
| Action 7 | 评估 Partner DBA 能力 — 当前 SI Partner 是否有 DBA 资源和 BigQuery 迁移经验？能否临时替补？ | ← 4a
| Action 8 | 与 VP of Operations 沟通调配 — 如果 DBA 在不同汇报线，需要 VP 级别的跨部门协调 | ← 4a,4c
| Action 9 | 确认数据验证的最低人力需求 — 哪些校验必须 DBA 做（如业务逻辑校验）？哪些 CE + Partner 可以先做（如技术校验）？ | ← 4a

## Discovery 产出物 {disc}
| 产出物 | DBA Engagement & Data Validation Plan — 包含：DBA 参与路径和时间表、数据验证分工矩阵（DBA 必做 vs CE/Partner 可先做）、自动化验证脚本可行性评估、风险和备选方案 |

## 执行计划 {exec}
| Phase 0 (Week 1) | 完成 Action 1-9；明确 DBA 调配路径；CE + Partner 启动可先行的技术验证工作 |
| Phase 1 (Week 2-3) | DBA part-time 介入（如 VP 协调成功）；完成 schema 映射和关键数据校验；自动化验证脚本上线 |
| Phase 2 (Week 4-7) | DBA 全面参与数据迁移验证；逐批次迁移 + 验证：每批次做行数、checksum、业务逻辑校验 |
| Phase 3 (Week 8-12) | 全量数据迁移完成；最终数据一致性签字确认；知识转移给运维团队 |

## RACI {raci}
| R — Responsible | Outcome CE（验证框架设计 + 自动化脚本）+ DBA Lead（schema 映射 + 业务校验） |
| A — Accountable | Head of Cloud Delivery（数据验证方法论审批） |
| C — Consulted | VP of Operations（跨部门调配 DBA）、Partner（DBA 替补 + 自动化支持）、Pre-sales CE（原始 schema 需求） |
| I — Informed | Security/Compliance（数据处理合规性） |

## 风险与成功标准 {risk}
| 成功标准 | DBA 在 Week 2 前 part-time 介入；schema 映射 100% 完成；迁移后数据一致性校验通过（行数一致 + checksum 一致 + 业务逻辑抽样通过） |
| 风险 | VP 协调失败，DBA 始终无法到位；Partner DBA 不熟悉 Legacy DB 业务逻辑 |
| 风险缓解 | 三管齐下——VP 协调内部 DBA + 评估 Partner DBA + 最大化自动化降低人工依赖；如果 Week 3 仍无 DBA，升级至 executive escalation |
| Blocker 依赖 | #5（Pipeline）修复后产出的数据需要 DBA 做完整性验证；#1（Interconnect）带宽决定了数据传输速度，进而影响 DBA 需要验证的数据批次节奏 |
