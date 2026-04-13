---
id: 3
title: Security Review Pending
badge: P0-长线
badge-class: p0
status: Stalled
status-class: stalled
subtitle: 日历时间最长的单一瓶颈 — 审批不过 = 全白做。Day 1 提交
---

## 基本信息
| 架构图位置 | 标注在审批流程层（非基础设施节点） |
| 架构图标注 | ⚠️ Security Review Pending |
| 上下游关系 | **下游:** 阻断 Production Go-Live——安全审批是上线的前置条件 |
| Impact | 安全审批不过，整个项目无法 go-live，前面所有修复都白做 |
| 假设归属 | H2: 组织与流程（安全规程/审批流程层面） |
| 怀疑方向 | 安全审批停滞不是因为项目不合规，而是审批流程本身有问题——标准不清、人员缺失、或安全团队缺乏 GCP 审计经验 |

## Sub-Hypotheses {hyp}

### 3a — 审批标准不清晰
安全团队没有明确的 GCP workload 审批 checklist，不知道审什么、怎么审
✅ | 访谈安全团队时无法说清审批标准；不同团队成员给出不同的要求；无正式文档 | → A1,2,3,4<br>→ A5
❌ | 有明确、文档化的审批 checklist，且项目团队已知晓 → 标准不是问题 | → A1,2,3,4<br>→ A5
→ | 检查 Sub-Hypothesis 3b |

### 3b — 缺乏 GCP 审计经验
团队熟悉传统 on-prem 安全审计但不知道如何评估云原生架构
✅ | 安全团队无人持有 GCP 安全认证；从未做过 GCP 项目审计 | → A2,3,4<br>→ A5,8
❌ | 团队有云安全审计经验或认证 → 不是能力问题 | → A2,3,4<br>→ A5,8
→ | 检查 Sub-Hypothesis 3c |

### 3c — 无人被指定为 Reviewer
安全审批没有明确的负责人，请求提交了但没人 pick up
✅ | 安全审批请求在队列中无人认领；无明确 reviewer 分配机制 | → A4<br>→ A5,6,7
❌ | 已有指定 reviewer，只是排队等待 → 是优先级/产能问题，不是流程缺失 | → A4<br>→ A5,6,7
→ | 审批停滞纯粹是优先级问题，需要管理层干预 |

## Discovery — Technical Actions {disc}
| Action 1 | 现有 Checklist 覆盖度分析 — 如果有 checklist，逐项对照 GCP 部署实际情况，标注"已满足 / 未满足 / 不适用" | ← 3a
| Action 2 | 合规报告生成 — 运行 Security Command Center 生成合规态势报告，作为审批证据材料 | ← 3a,3b
| Action 3 | GCP 安全控制映射 — 将客户现有合规要求（如 ISO 27001、SOC 2）逐条映射到 GCP 控制项（IAM、Encryption、Logging、VPC-SC） | ← 3a,3b
| Action 4 | 审批材料打包 — 整理安全审批所需的全部证据：架构图 + 合规报告 + IAM 配置 + 加密策略 + 日志配置 + 网络拓扑 | ← 3a,3b,3c

## Discovery — Process Actions {disc}
| Action 5 | 访谈安全团队 — 问三个问题：①你们的审批标准是什么？②你们需要什么证据？③你们有过 GCP 项目审计经验吗？ | ← 3a,3b,3c
| Action 6 | 确认 Reviewer Owner — 谁是 designated reviewer？如果没有，谁有权指定？ | ← 3c
| Action 7 | 确认审批周期预期 — 材料提交后预计多久能完成审批？有没有加急通道？ | ← 3c
| Action 8 | 评估安全团队 GCP 能力 — 如需 Security Workshop，提前准备议程和材料 | ← 3b

## Discovery 产出物 {disc}
| 产出物 | Security Review Readiness Assessment — 包含：现有审批流程诊断（标准是否清晰、reviewer 是否到位、团队是否有能力）、审批材料完整度评估、推荐行动（直接提交 vs 先跑 Workshop 建能力） |

## 执行计划 {exec}
| Phase 0 (Week 1) | 完成 Action 1-8；确认审批路径和材料需求；立即提交已有材料，不等材料完美 |
| Phase 0-1 (Week 1-3) | **若 3a/3b 确认（标准不清/能力不足）：**运行 Security Workshop——将合规要求映射到 GCP 控制，帮安全团队建立审批能力和 checklist<br>**若 3c 确认（无人负责）：**通过 Head of Cloud Delivery 或 VP 指定 reviewer + 设定审批 deadline |
| Phase 1-2 (Week 2-7) | 持续补充审批材料（每次技术修复后更新合规报告）；每周与安全团队同步审批进展；关键：绝不让审批阻塞其他工作流 |
| Phase 3 (Week 8-12) | 审批完成，获得 production clearance；安全 checklist 文档化供后续项目复用 |

## RACI {raci}
| R — Responsible | Outcome CE（GCP 安全最佳实践指导 + 材料准备）+ Customer Security Lead（执行审批） |
| A — Accountable | Head of Cloud Delivery（提供技术证据）；VP of Operations（审批最终签字） |
| C — Consulted | Compliance 团队（合规要求确认）、Google Specialist CE - Security（Workshop 支持）、Google TAM（合规工具支持） |
| I — Informed | Project Manager（跟踪审批状态） |

## 风险与成功标准 {risk}
| 成功标准 | 安全团队有明确的 GCP 审批 checklist；审批材料 100% 提交；在 Phase 2 结束前获得 production clearance |
| 风险 | 安全团队提出新的合规要求导致返工；审批周期拉长拖延 go-live |
| 风险缓解 | Week 1 就全面摸清审批要求，减少后期"惊喜"；将 Security Workshop 作为共建过程而非对抗过程——让安全团队参与定义标准，而非被动接受审批材料 |
| Blocker 依赖 | #2（Security Controls）的修复输出（Landing Zone 配置、org policy 状态）是本审批的输入材料；本审批是 Production Go-Live 的前置条件——所有其他 Blocker 修复后仍需等此审批通过<br>**⚠️ 伪依赖提示：**不必等 #2 全部完成再提交——已有材料 Day 1 立即提交，后续增量补充 |
